import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  updateEmployeeSchema,
  insertEmploymentSchema,
  updateEmploymentSchema,
  insertContactSchema,
  updateContactSchema,
  insertFamilyDetailsSchema,
  updateFamilyDetailsSchema,
  insertQrTokenSchema, 
  mobileClockInSchema,
  insertClockInSchema,
  insertOfficeLocationSchema,
  updateOfficeLocationSchema,
  insertWorkExperienceSchema,
  updateWorkExperienceSchema
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

  // Staff user creation route (for admin/HR creating new staff accounts)
  app.post("/api/create-staff-user", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can create new staff user accounts
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk membuat akaun staff baru" });
      }
      
      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ error: "Username, password dan role diperlukan" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username sudah wujud" });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password,
        role,
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create staff user error:", error);
      res.status(500).json({ error: "Gagal membuat akaun staff baru" });
    }
  });

  // Employee management routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      let employees;
      
      // Role-based access control
      if (currentUser.role === 'admin' || currentUser.role === 'hr') {
        // Admin and HR can see all employees with details
        employees = await storage.getAllEmployeesWithDetails();
      } else {
        // Regular employees can only see their own employee record
        const employee = await storage.getEmployeeByUserId(currentUser.id);
        if (employee) {
          const employmentData = await storage.getEmploymentByEmployeeId(employee.id);
          const contactData = await storage.getContactByEmployeeId(employee.id);
          employees = [{
            ...employee,
            employment: employmentData,
            contact: contactData
          }];
        } else {
          employees = [];
        }
      }
      
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai pekerja" });
    }
  });

  app.get("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control for individual employee access
      if (currentUser.role === 'admin' || currentUser.role === 'hr') {
        // Admin and HR can access any employee record
        res.json(employee);
      } else {
        // Regular employees can only access their own record
        if (employee.userId === currentUser.id) {
          res.json(employee);
        } else {
          return res.status(403).json({ error: "Tidak dibenarkan mengakses data pekerja lain" });
        }
      }
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat pekerja" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can create new employee records
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menambah pekerja baru" });
      }
      
      console.log("Request body:", req.body);
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Set userId if provided in request (for admin/HR assigning to specific user)
      // Otherwise, employee record will be created without user linkage
      const employeeData = {
        ...validatedData,
        // userId can be set by admin/HR when creating employee record for specific user
      };
      
      console.log("Validated data:", employeeData);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ error: "Gagal menambah pekerja" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const existingEmployee = await storage.getEmployee(req.params.id);
      
      if (!existingEmployee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control for updating
      if (currentUser.role === 'admin' || currentUser.role === 'hr') {
        // Admin and HR can update any employee record
      } else {
        // Regular employees can only update their own record
        if (existingEmployee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengemaskini data pekerja lain" });
        }
      }
      
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(400).json({ error: "Gagal mengemaskini pekerja" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin can delete employee records
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Hanya admin yang dibenarkan menghapuskan data pekerja" });
      }
      
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

  // Employee password management routes
  app.put("/api/employees/:id/change-password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password dan new password diperlukan" });
      }

      const success = await storage.changeEmployeePassword(req.params.id, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ error: "Gagal menukar password" });
      }

      res.json({ message: "Password berjaya ditukar" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Gagal menukar password" });
    }
  });

  app.post("/api/employees/:id/reset-password", authenticateToken, async (req, res) => {
    try {
      const newPassword = await storage.resetEmployeePassword(req.params.id);
      res.json({ 
        message: "Password berjaya direset",
        newPassword // In production, this would be sent via email instead
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Gagal mereset password" });
    }
  });

  // Employment management routes
  app.get("/api/employment/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employment = await storage.getEmploymentByEmployeeId(req.params.employeeId);
      
      // Role-based access control
      if (currentUser.role === 'admin' || currentUser.role === 'hr') {
        res.json(employment);
      } else {
        // Regular employees can only access their own employment record
        if (!employment || employment.employeeId !== req.params.employeeId) {
          return res.status(403).json({ error: "Tidak dibenarkan mengakses data pekerjaan lain" });
        }
        res.json(employment);
      }
    } catch (error) {
      console.error("Get employment error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat pekerjaan" });
    }
  });

  app.post("/api/employment", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can create employment records
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menambah maklumat pekerjaan" });
      }
      
      const validatedData = insertEmploymentSchema.parse(req.body);
      const employment = await storage.createEmployment(validatedData);
      res.status(201).json(employment);
    } catch (error) {
      console.error("Create employment error:", error);
      res.status(400).json({ error: "Gagal menambah maklumat pekerjaan" });
    }
  });

  app.put("/api/employment/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can update employment records
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk mengemaskini maklumat pekerjaan" });
      }
      
      const validatedData = updateEmploymentSchema.parse(req.body);
      const employment = await storage.updateEmployment(req.params.id, validatedData);
      if (!employment) {
        return res.status(404).json({ error: "Maklumat pekerjaan tidak dijumpai" });
      }
      res.json(employment);
    } catch (error) {
      console.error("Update employment error:", error);
      res.status(400).json({ error: "Gagal mengemaskini maklumat pekerjaan" });
    }
  });

  // Contact management routes
  app.get("/api/contact/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const contact = await storage.getContactByEmployeeId(req.params.employeeId);
      
      // Role-based access control
      if (currentUser.role === 'admin' || currentUser.role === 'hr') {
        res.json(contact);
      } else {
        // Regular employees can only access their own contact record
        if (!contact || contact.employeeId !== req.params.employeeId) {
          return res.status(403).json({ error: "Tidak dibenarkan mengakses data kontak lain" });
        }
        res.json(contact);
      }
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat kontak" });
    }
  });

  app.post("/api/contact", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can create contact records
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menambah maklumat kontak" });
      }
      
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(400).json({ error: "Gagal menambah maklumat kontak" });
    }
  });

  app.put("/api/contact/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can update contact records
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk mengemaskini maklumat kontak" });
      }
      
      const validatedData = updateContactSchema.parse(req.body);
      const contact = await storage.updateContact(req.params.id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Maklumat kontak tidak dijumpai" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Update contact error:", error);
      res.status(400).json({ error: "Gagal mengemaskini maklumat kontak" });
    }
  });

  // Work experience routes
  app.get("/api/work-experiences/:employeeId", authenticateToken, async (req, res) => {
    try {
      const workExperiences = await storage.getWorkExperiences(req.params.employeeId);
      res.json(workExperiences);
    } catch (error) {
      console.error("Get work experiences error:", error);
      res.status(500).json({ error: "Gagal mendapatkan pengalaman kerja" });
    }
  });

  app.post("/api/work-experiences", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkExperienceSchema.parse(req.body);
      const workExperience = await storage.createWorkExperience(validatedData);
      res.status(201).json(workExperience);
    } catch (error) {
      console.error("Create work experience error:", error);
      res.status(400).json({ error: "Gagal menambah pengalaman kerja" });
    }
  });

  app.put("/api/work-experiences/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = updateWorkExperienceSchema.parse(req.body);
      const workExperience = await storage.updateWorkExperience(req.params.id, validatedData);
      if (!workExperience) {
        return res.status(404).json({ error: "Pengalaman kerja tidak dijumpai" });
      }
      res.json(workExperience);
    } catch (error) {
      console.error("Update work experience error:", error);
      res.status(400).json({ error: "Gagal mengemaskini pengalaman kerja" });
    }
  });

  app.delete("/api/work-experiences/:id", authenticateToken, async (req, res) => {
    try {
      const deleted = await storage.deleteWorkExperience(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Pengalaman kerja tidak dijumpai" });
      }
      res.json({ message: "Pengalaman kerja berjaya dihapuskan" });
    } catch (error) {
      console.error("Delete work experience error:", error);
      res.status(500).json({ error: "Gagal menghapuskan pengalaman kerja" });
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

      // Get active office locations
      const activeLocations = await storage.getActiveOfficeLocations();
      if (activeLocations.length === 0) {
        return res.status(400).json({ 
          error: "Tiada lokasi pejabat aktif ditetapkan" 
        });
      }

      // Check if user is within any office location radius
      let locationStatus = "invalid";
      let nearestDistance = Infinity;
      let nearestLocationId = null;
      let locationMessage = "";

      for (const location of activeLocations) {
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude), 
          parseFloat(location.latitude), 
          parseFloat(location.longitude)
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLocationId = location.id;
        }

        // Check if within allowed radius for this location
        const maxDistance = parseFloat(location.radius);
        if (distance <= maxDistance) {
          locationStatus = "valid";
          break;
        }
      }

      if (locationStatus === "invalid") {
        locationMessage = "Anda berada di luar kawasan pejabat. Sila berada dalam kawasan yang ditetapkan untuk check in";
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
        locationStatus,
        distance: nearestDistance.toString(),
        officeLocationId: nearestLocationId
      });

      const user = await storage.getUser(qrToken.userId);

      res.json({
        success: true,
        clockInRecord: {
          id: clockInRecord.id,
          clockInTime: clockInRecord.clockInTime,
          locationStatus: clockInRecord.locationStatus,
          distance: Math.round(nearestDistance)
        },
        user: {
          username: user?.username
        },
        message: locationStatus === "valid" 
          ? "Clock-in berjaya! Anda berada dalam kawasan pejabat." 
          : locationMessage,
        distance: Math.round(nearestDistance)
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

  // Office Location management routes (admin only) 
  app.get("/api/office-locations", authenticateToken, async (req, res) => {
    try {
      const locations = await storage.getAllOfficeLocations();
      res.json(locations);
    } catch (error) {
      console.error("Get office locations error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai lokasi pejabat" });
    }
  });

  app.get("/api/office-locations/active", authenticateToken, async (req, res) => {
    try {
      const locations = await storage.getActiveOfficeLocations();
      res.json(locations);
    } catch (error) {
      console.error("Get active office locations error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai lokasi aktif" });
    }
  });

  app.post("/api/office-locations", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertOfficeLocationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const location = await storage.createOfficeLocation(validationResult.data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Create office location error:", error);
      res.status(500).json({ error: "Gagal mencipta lokasi pejabat" });
    }
  });

  app.put("/api/office-locations/:id", authenticateToken, async (req, res) => {
    try {
      const validationResult = updateOfficeLocationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const location = await storage.updateOfficeLocation(req.params.id, validationResult.data);
      if (!location) {
        return res.status(404).json({ error: "Lokasi tidak dijumpai" });
      }
      res.json(location);
    } catch (error) {
      console.error("Update office location error:", error);
      res.status(500).json({ error: "Gagal mengemaskini lokasi pejabat" });
    }
  });

  app.delete("/api/office-locations/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteOfficeLocation(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lokasi tidak dijumpai" });
      }
      res.json({ message: "Lokasi berjaya dipadam" });
    } catch (error) {
      console.error("Delete office location error:", error);
      res.status(500).json({ error: "Gagal memadamkan lokasi pejabat" });
    }
  });

  // =================== WORK EXPERIENCE ROUTES ===================
  // Get work experiences for an employee
  app.get("/api/work-experiences/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const workExperiences = await storage.getWorkExperiences(employeeId);
      res.json(workExperiences);
    } catch (error) {
      console.error("Get work experiences error:", error);
      res.status(500).json({ error: "Gagal mendapatkan pengalaman kerja" });
    }
  });

  // Create work experience
  app.post("/api/work-experiences", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertWorkExperienceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const workExperience = await storage.createWorkExperience(validationResult.data);
      res.status(201).json(workExperience);
    } catch (error) {
      console.error("Create work experience error:", error);
      res.status(500).json({ error: "Gagal menambah pengalaman kerja" });
    }
  });

  // Delete work experience
  app.delete("/api/work-experiences/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkExperience(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Pengalaman kerja tidak dijumpai" });
      }
      
      res.json({ success: true, message: "Pengalaman kerja telah dipadam" });
    } catch (error) {
      console.error("Delete work experience error:", error);
      res.status(500).json({ error: "Gagal memadamkan pengalaman kerja" });
    }
  });

  // Family Members management routes
  app.get("/api/family-members/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const familyMembers = await storage.getFamilyDetails(employeeId);
      res.json(familyMembers);
    } catch (error) {
      console.error("Get family members error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat keluarga" });
    }
  });

  app.post("/api/family-members", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertFamilyDetailsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.error("Family member validation error:", validationResult.error);
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.errors 
        });
      }

      const familyMember = await storage.createFamilyDetails(validationResult.data);
      res.status(201).json(familyMember);
    } catch (error) {
      console.error("Create family member error:", error);
      res.status(500).json({ error: "Gagal menambah ahli keluarga" });
    }
  });

  app.delete("/api/family-members/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFamilyDetails(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Ahli keluarga tidak dijumpai" });
      }
      
      res.json({ success: true, message: "Ahli keluarga telah dipadam" });
    } catch (error) {
      console.error("Delete family member error:", error);
      res.status(500).json({ error: "Gagal memadamkan ahli keluarga" });
    }
  });

  // =================== OBJECT STORAGE ROUTES ===================
  // The endpoint for serving private objects with authentication and ACL check
  app.get("/objects/:objectPath(*)", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "read" as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for object entity (for file uploads)
  app.post("/api/objects/upload", authenticateToken, async (req, res) => {
    try {
      console.log("Getting upload URL for user:", req.user?.username);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Generated upload URL successfully");
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Gagal mendapatkan URL upload" });
    }
  });

  // Update employee profile image
  app.put("/api/employees/:id/profile-image", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin and HR can update employee profile images
      if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
        return res.status(403).json({ error: "Tidak dibenarkan untuk mengemaskini gambar profil" });
      }

      const { profileImageUrl } = req.body;
      if (!profileImageUrl) {
        return res.status(400).json({ error: "profileImageUrl diperlukan" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        profileImageUrl,
        {
          owner: req.params.id, // Employee ID as owner
          visibility: "public", // Profile images are public
        }
      );

      // Update employee record with profile image URL
      const employee = await storage.updateEmployee(req.params.id, { 
        profileImageUrl: objectPath 
      });
      
      if (!employee) {
        return res.status(404).json({ error: "Employee tidak dijumpai" });
      }

      res.json({ 
        success: true, 
        objectPath,
        message: "Gambar profil berjaya dikemaskini" 
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ error: "Gagal mengemaskini gambar profil" });
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

  // =================== EMPLOYEE DOCUMENTS ROUTES ===================
  
  // Get employee documents
  app.get("/api/employee-documents/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const documents = await storage.getEmployeeDocuments(employeeId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      res.status(500).json({ error: "Gagal mendapatkan dokumen pekerja" });
    }
  });

  // Get single employee document
  app.get("/api/employee-documents/doc/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getEmployeeDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Dokumen tidak dijumpai" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching employee document:", error);
      res.status(500).json({ error: "Gagal mendapatkan dokumen" });
    }
  });

  // Create employee document
  app.post("/api/employee-documents", authenticateToken, async (req, res) => {
    try {
      const { employeeId, fileName, remarks, fileUrl } = req.body;

      if (!employeeId || !fileName || !fileUrl) {
        return res.status(400).json({ 
          error: "Employee ID, nama fail dan URL fail diperlukan" 
        });
      }

      // Process file URL through object storage service
      const objectStorageService = new ObjectStorageService();
      const processedFileUrl = await objectStorageService.trySetObjectEntityAclPolicy(
        fileUrl,
        {
          owner: req.user!.id,
          visibility: "private", // Documents are private by default
        },
      );

      const newDocument = await storage.createEmployeeDocument({
        employeeId,
        fileName,
        remarks: remarks || null,
        fileUrl: processedFileUrl,
        uploadedBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        document: newDocument,
        message: "Dokumen berjaya disimpan",
      });
    } catch (error) {
      console.error("Error creating employee document:", error);
      res.status(500).json({ error: "Gagal menyimpan dokumen" });
    }
  });

  // Update employee document
  app.put("/api/employee-documents/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { fileName, remarks, fileUrl } = req.body;

      const updates: any = {};
      if (fileName) updates.fileName = fileName;
      if (remarks !== undefined) updates.remarks = remarks;
      
      // If new file URL provided, process it
      if (fileUrl) {
        const objectStorageService = new ObjectStorageService();
        const processedFileUrl = await objectStorageService.trySetObjectEntityAclPolicy(
          fileUrl,
          {
            owner: req.user!.id,
            visibility: "private",
          },
        );
        updates.fileUrl = processedFileUrl;
      }

      const updatedDocument = await storage.updateEmployeeDocument(id, updates);

      if (!updatedDocument) {
        return res.status(404).json({ error: "Dokumen tidak dijumpai" });
      }

      res.json({
        success: true,
        document: updatedDocument,
        message: "Dokumen berjaya dikemaskini",
      });
    } catch (error) {
      console.error("Error updating employee document:", error);
      res.status(500).json({ error: "Gagal mengemaskini dokumen" });
    }
  });

  // Delete employee document
  app.delete("/api/employee-documents/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if document exists before deleting
      const document = await storage.getEmployeeDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Dokumen tidak dijumpai" });
      }

      await storage.deleteEmployeeDocument(id);

      res.json({
        success: true,
        message: "Dokumen berjaya dipadam",
      });
    } catch (error) {
      console.error("Error deleting employee document:", error);
      res.status(500).json({ error: "Gagal memadam dokumen" });
    }
  });

  // =================== EQUIPMENT ROUTES ===================
  
  // Get employee equipment
  app.get("/api/equipment/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const equipment = await storage.getEquipments(employeeId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Gagal mendapatkan equipment" });
    }
  });

  // Create equipment
  app.post("/api/equipment", authenticateToken, async (req, res) => {
    try {
      const { employeeId, equipmentName, serialNumber, dateReceived, dateReturned, remarks } = req.body;

      if (!employeeId || !equipmentName) {
        return res.status(400).json({ 
          error: "Employee ID dan nama equipment diperlukan" 
        });
      }

      const newEquipment = await storage.createEquipment({
        employeeId,
        equipmentName,
        serialNumber: serialNumber || null,
        dateReceived: dateReceived ? new Date(dateReceived) : null,
        dateReturned: dateReturned ? new Date(dateReturned) : null,
        remarks: remarks || null,
      });

      res.status(201).json({
        success: true,
        equipment: newEquipment,
        message: "Equipment berjaya ditambah",
      });
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ error: "Gagal menambah equipment" });
    }
  });

  // Update equipment
  app.put("/api/equipment/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { equipmentName, serialNumber, dateReceived, dateReturned, remarks } = req.body;

      const updates: any = {};
      if (equipmentName !== undefined) updates.equipmentName = equipmentName;
      if (serialNumber !== undefined) updates.serialNumber = serialNumber;
      if (dateReceived !== undefined) updates.dateReceived = dateReceived ? new Date(dateReceived) : null;
      if (dateReturned !== undefined) updates.dateReturned = dateReturned ? new Date(dateReturned) : null;
      if (remarks !== undefined) updates.remarks = remarks;

      const updatedEquipment = await storage.updateEquipment(id, updates);

      if (!updatedEquipment) {
        return res.status(404).json({ error: "Equipment tidak dijumpai" });
      }

      res.json({
        success: true,
        equipment: updatedEquipment,
        message: "Equipment berjaya dikemaskini",
      });
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ error: "Gagal mengemaskini equipment" });
    }
  });

  // Delete equipment
  app.delete("/api/equipment/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteEquipment(id);

      if (!deleted) {
        return res.status(404).json({ error: "Equipment tidak dijumpai" });
      }

      res.json({
        success: true,
        message: "Equipment berjaya dipadamkan",
      });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({ error: "Gagal memadamkan equipment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
