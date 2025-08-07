import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  updateEmployeeSchema,
  insertQrTokenSchema, 
  mobileClockInSchema,
  insertClockInSchema 
} from "@shared/schema";
import { checkEnvironmentSecrets } from "./env-check";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { randomUUID } from "crypto";

// Calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // Distance in meters
  return d;
}

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

  // QR Code Clock-In System Routes

  // Generate QR code token for desktop portal
  app.post("/api/qr-generate", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

      const qrToken = await storage.createQrToken({
        userId,
        token,
        isUsed: "false",
        expiresAt
      });

      // Generate QR code URL that will be accessed by mobile device
      const qrCodeUrl = `${req.protocol}://${req.get('host')}/mobile-clockin?token=${token}`;

      res.json({
        token: qrToken.token,
        qrCodeUrl,
        expiresAt: qrToken.expiresAt,
        message: "QR Code berjaya dijana"
      });
    } catch (error) {
      console.error("QR generate error:", error);
      res.status(500).json({ error: "Gagal menjana QR Code" });
    }
  });

  // Validate QR token and get user info for mobile page
  app.get("/api/qr-validate/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const qrToken = await storage.getValidQrToken(token);

      if (!qrToken) {
        return res.status(400).json({ 
          error: "QR Code tidak sah atau telah tamat tempoh",
          expired: true
        });
      }

      const user = await storage.getUser(qrToken.userId);
      if (!user) {
        return res.status(400).json({ error: "Pengguna tidak dijumpai" });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username
        },
        expiresAt: qrToken.expiresAt,
        message: "QR Code sah"
      });
    } catch (error) {
      console.error("QR validate error:", error);
      res.status(500).json({ error: "Gagal mengesahkan QR Code" });
    }
  });

  // Get selfie upload URL for mobile device
  app.post("/api/selfie-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getSelfieUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Selfie upload URL error:", error);
      res.status(500).json({ error: "Gagal mendapatkan URL upload" });
    }
  });

  // Submit mobile clock-in with selfie and GPS validation
  app.post("/api/mobile-clockin", async (req, res) => {
    try {
      const validationResult = mobileClockInSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const { token, latitude, longitude, selfieImageUrl } = validationResult.data;

      // Validate QR token
      const qrToken = await storage.getValidQrToken(token);
      if (!qrToken) {
        return res.status(400).json({ 
          error: "QR Code tidak sah atau telah tamat tempoh",
          expired: true
        });
      }

      // Office location coordinates (example: Kuala Lumpur city center)
      const OFFICE_LAT = 3.1390;
      const OFFICE_LNG = 101.6869;
      const MAX_DISTANCE = 50; // 50 meters radius

      // Calculate distance between user location and office
      const distance = calculateDistance(
        parseFloat(latitude), 
        parseFloat(longitude), 
        OFFICE_LAT, 
        OFFICE_LNG
      );

      let locationStatus = "valid";
      if (distance > MAX_DISTANCE) {
        locationStatus = "invalid";
      }

      // Process selfie image path
      const objectStorageService = new ObjectStorageService();
      const selfieImagePath = objectStorageService.normalizeSelfieImagePath(selfieImageUrl);

      // Mark QR token as used
      await storage.markQrTokenAsUsed(token);

      // Create clock-in record
      const clockInRecord = await storage.createClockInRecord({
        userId: qrToken.userId,
        latitude,
        longitude,
        selfieImagePath,
        locationStatus
      });

      const user = await storage.getUser(qrToken.userId);

      res.json({
        success: true,
        clockInRecord: {
          id: clockInRecord.id,
          clockInTime: clockInRecord.clockInTime,
          locationStatus: clockInRecord.locationStatus,
          distance: Math.round(distance)
        },
        user: {
          username: user?.username
        },
        message: locationStatus === "valid" 
          ? "Clock-in berjaya! Anda berada dalam kawasan pejabat." 
          : `Clock-in direkod tetapi anda berada ${Math.round(distance)}m dari pejabat (had: ${MAX_DISTANCE}m).`
      });

    } catch (error) {
      console.error("Mobile clock-in error:", error);
      res.status(500).json({ error: "Gagal melakukan clock-in" });
    }
  });

  // Serve selfie images (protected endpoint)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getSelfieFile(req.path);
      objectStorageService.downloadSelfie(objectFile, res);
    } catch (error) {
      console.error("Error serving selfie:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get user's clock-in history
  app.get("/api/clockin-history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clockInRecords = await storage.getUserClockInRecords(userId);
      
      res.json({
        clockInRecords: clockInRecords.map(record => ({
          id: record.id,
          clockInTime: record.clockInTime,
          locationStatus: record.locationStatus,
          latitude: record.latitude,
          longitude: record.longitude,
          selfieImagePath: record.selfieImagePath
        }))
      });
    } catch (error) {
      console.error("Clock-in history error:", error);
      res.status(500).json({ error: "Gagal mendapatkan sejarah clock-in" });
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
