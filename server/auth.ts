import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User, loginSchema } from "@shared/schema";

// Environment variables untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || "utamahr-secret-key-development";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Helper functions untuk password hashing
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Helper functions untuk JWT
function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware untuk verify JWT token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token diperlukan' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token tidak sah atau telah tamat tempoh' });
  }

  // Verify user masih wujud dalam database
  const user = await storage.getUser(decoded.id);
  if (!user) {
    return res.status(403).json({ error: 'User tidak dijumpai' });
  }

  req.user = user;
  next();
};

export function setupAuth(app: Express) {
  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username sudah digunakan" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const newUser = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
      });

      const token = generateToken(newUser);
      
      res.status(201).json({
        message: "User berjaya didaftarkan",
        user: {
          id: newUser.id,
          username: newUser.username,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Data tidak sah" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: "Username atau password tidak betul" });
      }

      const isValidPassword = await comparePasswords(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Username atau password tidak betul" });
      }

      const token = generateToken(user);

      res.json({
        message: "Login berjaya",
        user: {
          id: user.id,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Data tidak sah" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", authenticateToken, (req, res) => {
    res.json({
      id: req.user!.id,
      username: req.user!.username,
    });
  });

  // Logout endpoint (client-side akan remove token)
  app.post("/api/logout", (req, res) => {
    res.json({ message: "Logout berjaya" });
  });
}
