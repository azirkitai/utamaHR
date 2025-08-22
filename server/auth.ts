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
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Handle old plain text passwords (fallback for existing users)
  if (!stored.includes(".")) {
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
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
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user masih wujud within database
  const user = await storage.getUser(decoded.id);
  if (!user) {
    return res.status(403).json({ error: 'User not found' });
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
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const newUser = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
      });

      const token = generateToken(newUser);
      
      res.status(201).json({
        message: "User successfully registered",
        user: {
          id: newUser.id,
          username: newUser.username,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isValidPassword = await comparePasswords(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = generateToken(user);

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", authenticateToken, async (req, res) => {
    try {
      // Get fresh employee data from database to get current role
      const employee = await storage.getEmployeeByUserId(req.user!.id);
      res.json({
        id: req.user!.id,
        username: req.user!.username,
        role: employee?.role || req.user!.role, // Use employee role, fallback to JWT role
      });
    } catch (error) {
      console.error("Error fetching user employee data:", error);
      // Fallback to JWT data if database query fails
      res.json({
        id: req.user!.id,
        username: req.user!.username,
        role: req.user!.role,
      });
    }
  });

  // Logout endpoint (client-side akan remove token)
  app.post("/api/logout", (req, res) => {
    res.json({ message: "Logout successful" });
  });
}
