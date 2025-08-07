import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Protected dashboard route (example)
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

  const httpServer = createServer(app);
  return httpServer;
}
