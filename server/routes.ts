import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";
import { storage } from "./storage";
import { insertEmployeeSchema, updateEmployeeSchema } from "@shared/schema";
import { checkEnvironmentSecrets } from "./env-check";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Protected dashboard route
  app.get("/api/dashboard", authenticateToken, async (req, res) => {
    try {
      res.json({
        message: "Selamat datang ke UtamaHR Dashboard",
        user: {
          id: req.user!.id,
          username: req.user!.username,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Dashboard error" });
    }
  });

  // Employee management routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai pekerja" });
    }
  });

  app.get("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat pekerja" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ error: "Gagal menambah pekerja" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(400).json({ error: "Gagal mengemaskini pekerja" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      res.json({ message: "Pekerja berjaya dihapuskan" });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ error: "Gagal menghapuskan pekerja" });
    }
  });

  // Environment secrets check endpoint for debugging
  app.get("/api/env-check", authenticateToken, async (req, res) => {
    try {
      const envCheck = checkEnvironmentSecrets();
      res.json(envCheck);
    } catch (error) {
      console.error("Env check error:", error);
      res.status(500).json({ error: "Gagal memeriksa environment variables" });
    }
  });

  // Public health check (no auth required)
  app.get("/api/health", (req, res) => {
    const envCheck = checkEnvironmentSecrets();
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      secretsValid: envCheck.allValid,
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
