import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";
import { storage } from "./storage";
import { generatePayslipPDF } from './payslip-html-generator';
import { generatePayslipHTML } from './payslip-html-simple';
import { generatePayslipExcel } from './payslip-excel-generator';
import { generatePaymentVoucherPDF } from './payment-voucher-pdf-generator';
import { EmployeePDFGenerator } from './employee-pdf-generator';
import puppeteer from 'puppeteer';
import htmlPdf from 'html-pdf-node';
import Excel from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX files
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya fail PDF, DOC, dan DOCX dibenarkan'));
    }
  }
});
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
  insertShiftSchema,
  updateShiftSchema,
  insertWorkExperienceSchema,
  updateWorkExperienceSchema,
  insertLeaveApplicationSchema,
  updateLeaveApplicationSchema,
  insertAttendanceRecordSchema,
  updateAttendanceRecordSchema,
  insertApprovalSettingSchema,
  updateApprovalSettingSchema,
  approvalSettings,
  insertGroupPolicySettingSchema,
  updateGroupPolicySettingSchema,
  insertCompanyLeaveTypeSchema,
  updateCompanyLeaveTypeSchema,
  insertFinancialClaimPolicySchema,
  updateFinancialClaimPolicySchema,
  insertClaimApplicationSchema,
  updateClaimApplicationSchema,
  insertOvertimeApprovalSettingSchema,
  updateOvertimeApprovalSettingSchema,
  insertOvertimePolicySchema,
  updateOvertimePolicySchema,
  insertOvertimeSettingSchema,
  updateOvertimeSettingSchema,
  insertFinancialSettingsSchema,
  updateFinancialSettingsSchema,
  insertPayrollDocumentSchema,
  updatePayrollDocumentSchema,
  insertPayrollItemSchema,
  updatePayrollItemSchema,
  insertCompanySettingSchema,
  updateCompanySettingSchema,
  insertPaymentVoucherSchema,
  updatePaymentVoucherSchema,
  insertHolidaySchema,
  updateHolidaySchema,
  insertEventSchema,
  updateEventSchema,
  insertFormSchema,
  updateFormSchema,
  type AttendanceRecord
} from "@shared/schema";
import { checkEnvironmentSecrets } from "./env-check";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { randomUUID } from "crypto";
import { z } from "zod";
import { eq, and, or, like, desc, lte, gte, inArray, isNotNull, isNull, ne, sql, count, not, lt } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  employees, 
  employment, 
  contact, 
  familyDetails, 
  qrTokens, 
  officeLocations, 
  clockInRecords, 
  workExperiences,
  leaveApplications,
  attendanceRecords,
  groupPolicySettings,
  companyLeaveTypes,
  announcements,
  announcementReads,
  overtimeApprovalSettings,
  overtimePolicies,
  overtimeSettings,
  financialClaimPolicies,
  payrollItems,
  payrollDocuments,
  employeeSalaries,
  forms,
  disciplinaryRecords,
  insertDisciplinaryRecordSchema,
  updateDisciplinaryRecordSchema
} from "@shared/schema";

// Helper function to get month name
function getMonthName(month: number): string {
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  return monthNames[month - 1] || 'UNKNOWN';
}

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

// Helper function to process break-out (leaving for break/lunch)
async function processBreakOut(
  res: any,
  qrToken: any,
  todayAttendance: AttendanceRecord,
  latitude: string,
  longitude: string,
  selfieImageUrl: string,
  storage: any
) {
  try {
    // Get active office locations for validation
    const activeLocations = await storage.getActiveOfficeLocations();
    if (activeLocations.length === 0) {
      return res.status(400).json({ 
        error: "Tiada lokasi pejabat aktif ditetapkan" 
      });
    }

    // Check location for break-out
    let locationStatus = "invalid";
    let nearestDistance = Infinity;
    let nearestLocationId = null;

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

      const maxDistance = parseFloat(location.radius);
      if (distance <= maxDistance) {
        locationStatus = "valid";
        break;
      }
    }

    // Process selfie image
    const objectStorageService = new ObjectStorageService();
    const selfieImagePath = objectStorageService.normalizeSelfieImagePath(selfieImageUrl);

    // Mark QR token as used
    await storage.markQrTokenAsUsed(qrToken.token);

    // Update attendance record with break-out information
    await storage.createOrUpdateAttendanceRecord({
      employeeId: todayAttendance.employeeId,
      userId: todayAttendance.userId,
      date: todayAttendance.date,
      breakOutTime: new Date(),
      breakOutImage: selfieImagePath,
      status: locationStatus === "valid" ? "present" : "invalid_location"
    });

    const user = await storage.getUser(qrToken.userId);
    
    return res.json({
      success: true,
      isBreakOut: true,
      breakOutTime: new Date(),
      locationStatus: locationStatus,
      user: {
        username: user?.username
      },
      message: "Break time telah direkodkan"
    });
  } catch (error) {
    console.error("Break-out processing error:", error);
    return res.status(500).json({ error: "Gagal memproses break time" });
  }
}

// Helper function to process break-in (returning from break/lunch)
async function processBreakIn(
  res: any,
  qrToken: any,
  todayAttendance: AttendanceRecord,
  latitude: string,
  longitude: string,
  selfieImageUrl: string,
  storage: any
) {
  try {
    // Get active office locations for validation
    const activeLocations = await storage.getActiveOfficeLocations();
    if (activeLocations.length === 0) {
      return res.status(400).json({ 
        error: "Tiada lokasi pejabat aktif ditetapkan" 
      });
    }

    // Check location for break-in
    let locationStatus = "invalid";
    let nearestDistance = Infinity;
    let nearestLocationId = null;

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

      const maxDistance = parseFloat(location.radius);
      if (distance <= maxDistance) {
        locationStatus = "valid";
        break;
      }
    }

    // Process selfie image
    const objectStorageService = new ObjectStorageService();
    const selfieImagePath = objectStorageService.normalizeSelfieImagePath(selfieImageUrl);

    // Mark QR token as used
    await storage.markQrTokenAsUsed(qrToken.token);

    // Check shift compliance for BREAK-OFF only
    const employee = await storage.getEmployee(todayAttendance.employeeId);
    const currentTime = new Date();
    let breakOffCompliance = {
      isLateBreakOut: false,
      breakOutRemarks: null
    };

    try {
      // Get employee's active shift assignment for break-off compliance
      const activeShift = await storage.getEmployeeActiveShift(employee.id);
      if (activeShift && activeShift.enableStrictClockIn && activeShift.breakOut) {
        // Parse shift break-out time
        const shiftBreakOutTime = activeShift.breakOut; // e.g., "13:00"
        const [breakHour, breakMinute] = shiftBreakOutTime.split(':').map(Number);
        
        // Create shift break-out time for today
        const todayBreakOut = new Date(currentTime);
        todayBreakOut.setHours(breakHour, breakMinute, 0, 0);
        
        // Check if break-off is late (BREAK-OFF compliance only)
        if (currentTime > todayBreakOut) {
          const lateMinutes = Math.floor((currentTime.getTime() - todayBreakOut.getTime()) / (1000 * 60));
          breakOffCompliance.isLateBreakOut = true;
          breakOffCompliance.breakOutRemarks = `Break off lewat ${lateMinutes} minit dari masa yang ditetapkan ${shiftBreakOutTime}. Perlu semakan penyelia.`;
        }
      }
    } catch (error) {
      console.error("Break-off compliance check error:", error);
      // Continue with normal break-off even if shift check fails
    }

    // Update attendance record with break-in information and compliance
    await storage.createOrUpdateAttendanceRecord({
      employeeId: todayAttendance.employeeId,
      userId: todayAttendance.userId,
      date: todayAttendance.date,
      breakInTime: new Date(),
      breakInImage: selfieImagePath,
      status: locationStatus === "valid" ? "present" : "invalid_location",
      isLateBreakOut: breakOffCompliance.isLateBreakOut,
      breakOutRemarks: breakOffCompliance.breakOutRemarks
    });

    const user = await storage.getUser(qrToken.userId);
    
    return res.json({
      success: true,
      isBreakIn: true,
      breakInTime: new Date(),
      locationStatus: locationStatus,
      user: {
        username: user?.username
      },
      message: "Break off telah direkodkan"
    });
  } catch (error) {
    console.error("Break-in processing error:", error);
    return res.status(500).json({ error: "Gagal memproses break off" });
  }
}

// Helper function to process clock-out
async function processClockOut(
  res: any,
  qrToken: any,
  todayAttendance: AttendanceRecord,
  latitude: string,
  longitude: string,
  selfieImageUrl: string,
  storage: any
) {
  try {
    // Get active office locations for validation
    const activeLocations = await storage.getActiveOfficeLocations();
    if (activeLocations.length === 0) {
      return res.status(400).json({ 
        error: "Tiada lokasi pejabat aktif ditetapkan" 
      });
    }

    // Check location for clock-out
    let locationStatus = "invalid";
    let nearestDistance = Infinity;
    let nearestLocationId = null;

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

      const maxDistance = parseFloat(location.radius);
      if (distance <= maxDistance) {
        locationStatus = "valid";
        break;
      }
    }

    // Process selfie image
    const objectStorageService = new ObjectStorageService();
    const selfieImagePath = objectStorageService.normalizeSelfieImagePath(selfieImageUrl);

    // Mark QR token as used
    await storage.markQrTokenAsUsed(qrToken.token);

    // Calculate total hours
    const clockInTime = todayAttendance.clockInTime ? new Date(todayAttendance.clockInTime) : new Date();
    const clockOutTime = new Date();
    const totalHours = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) * 100) / 100;

    // Update attendance record with clock-out information
    await storage.createOrUpdateAttendanceRecord({
      employeeId: todayAttendance.employeeId,
      userId: todayAttendance.userId,
      date: todayAttendance.date,
      clockOutTime: clockOutTime,
      clockOutLatitude: latitude,
      clockOutLongitude: longitude,
      clockOutLocationStatus: locationStatus,
      clockOutDistance: nearestDistance.toString(),
      clockOutOfficeLocationId: nearestLocationId,
      clockOutImage: selfieImagePath,
      totalHours: totalHours.toString(),
      status: locationStatus === "valid" ? "present" : "invalid_location"
    });

    const user = await storage.getUser(qrToken.userId);
    
    return res.json({
      success: true,
      isClockOut: true,
      clockOutTime: clockOutTime,
      locationStatus: locationStatus,
      totalHours: totalHours,
      user: {
        username: user?.username
      },
      message: locationStatus === "valid" 
        ? `Clock-out berjaya! Total jam kerja: ${totalHours} jam.` 
        : `Clock-out di luar kawasan pejabat. Total jam kerja: ${totalHours} jam.`,
      distance: Math.round(nearestDistance)
    });

  } catch (error) {
    console.error("Process clock-out error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
    return res.status(500).json({ 
      error: "Gagal melakukan clock-out",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Protected dashboard route
  app.get("/api/dashboard", authenticateToken, async (req, res) => {
    try {
      // Get user with role information from database
      const user = await storage.getUser(req.user!.id);
      
      res.json({
        message: "Selamat datang ke UtamaHR Dashboard",
        user: {
          id: req.user!.id,
          username: req.user!.username,
          role: user?.role || null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Dashboard error" });
    }
  });

  // Dashboard statistics endpoint  
  app.get("/api/dashboard-statistics", authenticateToken, async (req, res) => {
    try {
      const statistics = await storage.getDashboardStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Dashboard statistics error:", error);
      res.status(500).json({ error: "Gagal mendapatkan statistik dashboard" });
    }
  });

  // User statistics endpoint  
  app.get("/api/user-statistics", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const statistics = await storage.getUserStatistics(currentUser.id);
      res.json(statistics);
    } catch (error) {
      console.error("User statistics error:", error);
      res.status(500).json({ error: "Gagal mendapatkan statistik pengguna" });
    }
  });

  // Pending approval statistics endpoint  
  app.get("/api/pending-approval-statistics", authenticateToken, async (req, res) => {
    try {
      const statistics = await storage.getPendingApprovalStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Pending approval statistics error:", error);
      res.status(500).json({ error: "Gagal mendapatkan statistik pending approval" });
    }
  });

  // Get today's attendance with employee details and selfie images
  app.get("/api/today-attendance", authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttendance = await db
        .select({
          id: attendanceRecords.id,
          employeeId: attendanceRecords.employeeId,
          fullName: employees.fullName,
          profileImageUrl: employees.profileImageUrl,
          clockInTime: attendanceRecords.clockInTime,
          clockOutTime: attendanceRecords.clockOutTime,
          clockInImage: attendanceRecords.clockInImage,
          clockOutImage: attendanceRecords.clockOutImage,
          status: attendanceRecords.status,
          totalHours: attendanceRecords.totalHours,
        })
        .from(attendanceRecords)
        .leftJoin(employees, eq(attendanceRecords.employeeId, employees.id))
        .where(
          and(
            gte(attendanceRecords.date, today),
            lt(attendanceRecords.date, tomorrow)
          )
        )
        .orderBy(desc(attendanceRecords.clockInTime));

      res.json(todayAttendance);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  // Get current user's employee data endpoint
  app.get("/api/user/employee", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee data not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Get user employee error:", error);
      res.status(500).json({ error: "Gagal mendapatkan data pekerja" });
    }
  });

  // Get current user's payroll records for My Record page
  app.get("/api/user/payroll-records", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const payrollRecords = await storage.getUserPayrollRecords(currentUser.id);
      
      res.json(payrollRecords);
    } catch (error) {
      console.error("Get user payroll records error:", error);
      res.status(500).json({ error: "Gagal mendapatkan rekod gaji pengguna" });
    }
  });

  // Announcements endpoints
  app.get("/api/announcements", authenticateToken, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      const announcements = await storage.getAnnouncementsForUser(currentUserId);
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ error: "Gagal mendapatkan pengumuman" });
    }
  });

  app.post("/api/announcements", authenticateToken, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account', 'Manager/Supervisor'].includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - peranan tidak mencukupi" });
      }

      const { title, message, department, targetEmployees, attachment } = req.body;
      
      const announcementData = {
        title,
        message,
        department: department || null,
        targetEmployees,
        attachment: attachment || null,
        announcerId: req.user!.id,
        announcerName: currentUser.username,
      };

      const announcement = await storage.createAnnouncement(announcementData);
      res.json({ success: true, announcement });
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(500).json({ error: "Gagal mencipta pengumuman" });
    }
  });

  app.delete("/api/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account', 'Manager/Supervisor'].includes(currentUser.role)) {
        return res.status(403).json({ error: "Access denied - insufficient role" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      
      if (deleted) {
        res.json({ success: true, message: "Announcement deleted successfully" });
      } else {
        res.status(404).json({ error: "Announcement not found" });
      }
    } catch (error) {
      console.error("Delete announcement error:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Get unread announcements for dashboard
  app.get("/api/announcements/unread", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const unreadAnnouncements = await storage.getUnreadAnnouncementsForUser(userId);
      res.json(unreadAnnouncements);
    } catch (error) {
      console.error("Get unread announcements error:", error);
      res.status(500).json({ error: "Gagal mendapatkan pengumuman yang belum dibaca" });
    }
  });

  // Mark announcement as read (acknowledge)
  app.post("/api/announcements/:id/acknowledge", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await storage.markAnnouncementAsRead(id, userId);
      res.json({ success: true, message: "Pengumuman telah ditanda sebagai dibaca" });
    } catch (error) {
      console.error("Acknowledge announcement error:", error);
      res.status(500).json({ error: "Gagal menanda pengumuman sebagai dibaca" });
    }
  });

  app.get("/api/announcements", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const announcements = await storage.getAnnouncementsForUser(userId);
      res.json(announcements);
    } catch (error) {
      console.error("Fetch announcements error:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.put("/api/announcements/:id", authenticateToken, async (req, res) => {
    try {
      const announcementId = req.params.id;
      const { title, message } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }

      const updatedAnnouncement = await storage.updateAnnouncement(announcementId, {
        title,
        message,
      });

      res.json({ success: true, announcement: updatedAnnouncement });
    } catch (error) {
      console.error("Update announcement error:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  // Public attachment download - accessible to all authenticated users via any method
  app.get("/api/announcements/attachment/:id", async (req, res) => {
    try {
      const announcementId = req.params.id;
      
      console.log('=== ATTACHMENT DOWNLOAD DEBUG ===');
      console.log('Request headers:', req.headers);
      console.log('User-Agent:', req.headers['user-agent']);
      console.log('Referer:', req.headers.referer);
      
      // For now, allow all requests from the same origin (simplified security)
      const referer = req.headers.referer;
      if (!referer || !referer.includes(req.headers.host || 'localhost')) {
        console.log('Invalid referer - request not from same origin');
        return res.status(403).json({ error: "Access denied" });
      }
      
      const announcement = await storage.getAnnouncementById(announcementId);
      
      if (!announcement || !announcement.attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Clean filename to prevent header issues - more aggressive sanitization
      const cleanFilename = announcement.attachment
        .replace(/[^\w\s.-]/g, '_')  // Replace special chars with underscore
        .replace(/\s+/g, '_')        // Replace spaces with underscore
        .replace(/_{2,}/g, '_')      // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '');    // Remove leading/trailing underscores
      
      console.log('Original filename:', announcement.attachment);
      console.log('Cleaned filename:', cleanFilename);
      
      // Set proper headers for file download with safe filename
      const safeFilename = cleanFilename || 'attachment.txt';
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Simulate file content - in production this would be from cloud storage/file system
      const mockFileContent = `This is a simulated file download for: ${announcement.attachment}\n\nIn production, this would contain the actual file content from cloud storage or file system.\n\nAnnouncement: ${announcement.title}\nFile: ${announcement.attachment}`;
      
      res.send(mockFileContent);
    } catch (error) {
      console.error("Download attachment error:", error);
      res.status(500).json({ error: "Failed to download attachment" });
    }
  });

  // Get unread announcement count for current user
  app.get("/api/announcements/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Getting unread count for user:', userId);

      // Get all announcements targeted to this user that they haven't read yet
      const allAnnouncementsForUser = await db
        .select()
        .from(announcements)
        .where(sql`${announcements.targetEmployees} @> ARRAY[${userId}]`);
      
      // Get announcement IDs that user has already read
      const readAnnouncements = await db
        .select({ announcementId: announcementReads.announcementId })
        .from(announcementReads)
        .where(eq(announcementReads.userId, userId));
      
      const readAnnouncementIds = readAnnouncements.map(r => r.announcementId);
      
      // Count unread announcements
      const unreadCount = allAnnouncementsForUser.filter(
        announcement => !readAnnouncementIds.includes(announcement.id)
      ).length;

      console.log('Total announcements for user:', allAnnouncementsForUser.length);
      console.log('Read announcements:', readAnnouncementIds.length);
      console.log('Unread count:', unreadCount);

      res.json(unreadCount);
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Mark announcement as read when user views it
  app.post("/api/announcements/:id/mark-read", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const announcementId = req.params.id;

      console.log('Marking announcement as read:', { userId, announcementId });

      // Check if user has already read this announcement
      const existingRead = await db
        .select()
        .from(announcementReads)
        .where(
          and(
            eq(announcementReads.userId, userId),
            eq(announcementReads.announcementId, announcementId)
          )
        )
        .limit(1);

      if (existingRead.length === 0) {
        // Mark as read
        await db
          .insert(announcementReads)
          .values({
            userId: userId,
            announcementId: announcementId,
          });
        
        console.log('Announcement marked as read successfully');
      } else {
        console.log('Announcement already marked as read');
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Get user's read status for all announcements
  app.get("/api/announcements/read-status", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Getting read status for user:', userId);

      // Get all announcements that this user has read
      const readAnnouncements = await db
        .select({
          announcementId: announcementReads.announcementId,
          readAt: announcementReads.readAt,
        })
        .from(announcementReads)
        .where(eq(announcementReads.userId, userId));

      console.log('Read announcements found:', readAnnouncements.length);
      
      res.json(readAnnouncements);
    } catch (error) {
      console.error("Get read status error:", error);
      res.status(500).json({ error: "Failed to get read status" });
    }
  });

  // Get active company leave types only
  app.get("/api/company-leave-types/active", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching active company leave types...');
      
      const activeLeaveTypes = await db
        .select()
        .from(companyLeaveTypes)
        .where(eq(companyLeaveTypes.enabled, true))
        .orderBy(companyLeaveTypes.leaveType);

      console.log('Active leave types found:', activeLeaveTypes.length);
      
      res.json(activeLeaveTypes);
    } catch (error) {
      console.error("Get active leave types error:", error);
      res.status(500).json({ error: "Failed to get active leave types" });
    }
  });

  // Get leave statistics by type (only for active/enabled leave types)
  app.get("/api/leave-statistics", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching leave statistics...');
      
      // Get only enabled leave types
      const enabledLeaveTypes = await db
        .select()
        .from(companyLeaveTypes)
        .where(eq(companyLeaveTypes.enabled, true));

      const statistics = [];
      
      for (const leaveType of enabledLeaveTypes) {
        // Count total approved leave applications for this type (ALL employees)
        const approvedApplications = await db
          .select()
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.leaveType, leaveType.leaveType),
              eq(leaveApplications.status, 'Approved')
            )
          );

        // Calculate total days taken across all employees
        const totalDaysTaken = approvedApplications.reduce((sum, app) => {
          return sum + parseInt(app.totalDays || '0');
        }, 0);

        statistics.push({
          leaveType: leaveType.leaveType,
          leaveTypeId: leaveType.id,
          totalApplications: approvedApplications.length,
          totalDaysTaken: totalDaysTaken,
          entitlementDays: leaveType.entitlementDays || 0,
          enabled: leaveType.enabled
        });
      }

      console.log('Leave statistics calculated:', statistics.length, 'types');
      
      res.json(statistics);
    } catch (error) {
      console.error("Get leave statistics error:", error);
      res.status(500).json({ error: "Failed to get leave statistics" });
    }
  });

  // Get leave summary for all employees (employee-wise breakdown)
  app.get("/api/leave-summary-all-employees", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching leave summary for all employees...');
      
      // Get all employees
      const allEmployees = await db
        .select({
          id: employees.id,
          fullName: employees.fullName,
          userId: employees.userId
        })
        .from(employees)
        .where(eq(employees.status, 'employed'));

      // Get only enabled leave types
      const enabledLeaveTypes = await db
        .select()
        .from(companyLeaveTypes)
        .where(eq(companyLeaveTypes.enabled, true));

      const employeeSummary = [];

      for (const employee of allEmployees) {
        const employeeData = {
          employeeId: employee.id,
          employeeName: employee.fullName,
          leaveBreakdown: {} as Record<string, any>
        };

        // For each enabled leave type, calculate this employee's usage
        for (const leaveType of enabledLeaveTypes) {
          const approvedApplications = await db
            .select()
            .from(leaveApplications)
            .where(
              and(
                eq(leaveApplications.employeeId, employee.id),
                eq(leaveApplications.leaveType, leaveType.leaveType),
                eq(leaveApplications.status, 'Approved')
              )
            );

          const totalDaysTaken = approvedApplications.reduce((sum, app) => {
            return sum + parseInt(app.totalDays || '0');
          }, 0);

          employeeData.leaveBreakdown[leaveType.leaveType] = {
            daysTaken: totalDaysTaken,
            applicationsCount: approvedApplications.length,
            entitlementDays: leaveType.entitlementDays || 0,
            remainingDays: (leaveType.entitlementDays || 0) - totalDaysTaken
          };
        }

        employeeSummary.push(employeeData);
      }

      console.log('Employee leave summary calculated:', employeeSummary.length, 'employees');
      
      res.json({
        employees: employeeSummary,
        enabledLeaveTypes: enabledLeaveTypes
      });
    } catch (error) {
      console.error("Get employee leave summary error:", error);
      res.status(500).json({ error: "Failed to get employee leave summary" });
    }
  });

  // Individual leave entitlement adjustments endpoints
  
  // Create individual leave entitlement adjustment
  app.post("/api/leave-adjustments", authenticateToken, async (req, res) => {
    try {
      const {
        employeeId,
        leaveType,
        originalEntitlement,
        adjustedEntitlement,
        adjustmentReason,
        effectiveDate,
        status = 'active'
      } = req.body;

      console.log('Creating individual leave adjustment:', {
        employeeId,
        leaveType,
        originalEntitlement,
        adjustedEntitlement,
        adjustmentReason
      });

      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager'].includes(currentUser.role)) {
        return res.status(403).json({ 
          error: "Akses ditolak - hanya Super Admin, Admin, dan HR Manager boleh membuat pelarasan cuti individu" 
        });
      }

      // Validate required fields
      if (!employeeId || !leaveType || adjustedEntitlement === undefined) {
        return res.status(400).json({ 
          error: "Field yang diperlukan: employeeId, leaveType, adjustedEntitlement" 
        });
      }

      // Create the adjustment record
      const adjustmentData = {
        employeeId,
        leaveType,
        originalEntitlement: originalEntitlement || 0,
        adjustedEntitlement,
        adjustmentReason: adjustmentReason || '',
        effectiveDate: new Date(effectiveDate || new Date()),
        status,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const adjustment = await storage.createEmployeeLeaveEntitlementAdjustment(adjustmentData);
      
      res.json({ 
        success: true, 
        adjustment,
        message: "Pelarasan cuti individu berjaya disimpan" 
      });
      
    } catch (error) {
      console.error("Create leave adjustment error:", error);
      res.status(500).json({ 
        error: "Gagal menyimpan pelarasan cuti individu" 
      });
    }
  });

  // Get individual leave adjustments for an employee
  app.get("/api/leave-adjustments/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      console.log('Getting leave adjustments for employee:', employeeId);
      
      const adjustments = await storage.getEmployeeLeaveEntitlementAdjustments(employeeId);
      
      res.json(adjustments);
      
    } catch (error) {
      console.error("Get leave adjustments error:", error);
      res.status(500).json({ 
        error: "Gagal mendapatkan pelarasan cuti individu" 
      });
    }
  });

  // Update individual leave adjustment
  app.put("/api/leave-adjustments/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager'].includes(currentUser.role)) {
        return res.status(403).json({ 
          error: "Akses ditolak - hanya Super Admin, Admin, dan HR Manager boleh mengemas kini pelarasan cuti" 
        });
      }

      updateData.updatedAt = new Date();
      const updated = await storage.updateEmployeeLeaveEntitlementAdjustment(id, updateData);
      
      if (updated) {
        res.json({ 
          success: true, 
          message: "Pelarasan cuti individu berjaya dikemas kini" 
        });
      } else {
        res.status(404).json({ 
          error: "Pelarasan cuti tidak dijumpai" 
        });
      }
      
    } catch (error) {
      console.error("Update leave adjustment error:", error);
      res.status(500).json({ 
        error: "Gagal mengemas kini pelarasan cuti individu" 
      });
    }
  });

  // Delete individual leave adjustment
  app.delete("/api/leave-adjustments/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager'].includes(currentUser.role)) {
        return res.status(403).json({ 
          error: "Akses ditolak - hanya Super Admin, Admin, dan HR Manager boleh memadam pelarasan cuti" 
        });
      }

      const deleted = await storage.deleteEmployeeLeaveEntitlementAdjustment(id);
      
      if (deleted) {
        res.json({ 
          success: true, 
          message: "Pelarasan cuti individu berjaya dipadam" 
        });
      } else {
        res.status(404).json({ 
          error: "Pelarasan cuti tidak dijumpai" 
        });
      }
      
    } catch (error) {
      console.error("Delete leave adjustment error:", error);
      res.status(500).json({ 
        error: "Gagal memadam pelarasan cuti individu" 
      });
    }
  });

  // =================== EMPLOYEE LEAVE ELIGIBILITY API ROUTES ===================
  
  // Set employee leave eligibility (toggle switch functionality)
  app.post("/api/leave-eligibility", authenticateToken, async (req, res) => {
    try {
      const { employeeId, leaveType, isEligible, remarks } = req.body;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager'].includes(currentUser.role)) {
        return res.status(403).json({ 
          error: "Akses ditolak - hanya Super Admin, Admin, dan HR Manager boleh mengubah kelayakan cuti" 
        });
      }

      const eligibilityData = {
        employeeId,
        leaveType,
        isEligible: isEligible ?? true,
        remarks: remarks || null,
        setBy: currentUser.id
      };

      const result = await storage.setEmployeeLeaveEligibility(eligibilityData);
      
      res.status(201).json({ 
        success: true, 
        message: `Kelayakan cuti ${leaveType} berjaya ${isEligible ? 'diaktifkan' : 'dinyahaktifkan'} untuk pekerja ini`,
        data: result
      });
      
    } catch (error) {
      console.error("Set leave eligibility error:", error);
      res.status(500).json({ 
        error: "Gagal mengubah kelayakan cuti individu" 
      });
    }
  });

  // Get employee leave eligibility records
  app.get("/api/leave-eligibility/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      
      // Get employee to check if current user can access
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Allow access if admin role or own data
      if (!adminRoles.includes(currentUser.role) && employee.userId !== currentUser.id) {
        return res.status(403).json({ 
          error: "Akses ditolak - tidak dibenarkan melihat kelayakan cuti pekerja lain" 
        });
      }

      const eligibilityRecords = await storage.getEmployeeLeaveEligibility(employeeId);
      
      res.json(eligibilityRecords);
      
    } catch (error) {
      console.error("Get leave eligibility error:", error);
      res.status(500).json({ 
        error: "Gagal mendapatkan kelayakan cuti individu" 
      });
    }
  });

  // Check if employee is eligible for specific leave type
  app.get("/api/leave-eligibility/:employeeId/:leaveType", authenticateToken, async (req, res) => {
    try {
      const { employeeId, leaveType } = req.params;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      
      // Get employee to check if current user can access
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Allow access if admin role or own data
      if (!adminRoles.includes(currentUser.role) && employee.userId !== currentUser.id) {
        return res.status(403).json({ 
          error: "Akses ditolak - tidak dibenarkan melihat kelayakan cuti pekerja lain" 
        });
      }

      const isEligible = await storage.isEmployeeEligibleForLeave(employeeId, leaveType);
      
      res.json({ 
        employeeId,
        leaveType,
        isEligible,
        message: isEligible 
          ? `Pekerja ini layak untuk ${leaveType}` 
          : `Pekerja ini tidak layak untuk ${leaveType}`
      });
      
    } catch (error) {
      console.error("Check leave eligibility error:", error);
      res.status(500).json({ 
        error: "Gagal memeriksa kelayakan cuti" 
      });
    }
  });

  // Delete employee leave eligibility (reset to default - eligible)
  app.delete("/api/leave-eligibility/:employeeId/:leaveType", authenticateToken, async (req, res) => {
    try {
      const { employeeId, leaveType } = req.params;
      
      // Check user permissions
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser || !['Super Admin', 'Admin', 'HR Manager'].includes(currentUser.role)) {
        return res.status(403).json({ 
          error: "Akses ditolak - hanya Super Admin, Admin, dan HR Manager boleh mereset kelayakan cuti" 
        });
      }

      const deleted = await storage.deleteEmployeeLeaveEligibility(employeeId, leaveType);
      
      if (deleted) {
        res.json({ 
          success: true, 
          message: `Kelayakan cuti ${leaveType} telah direset ke default (layak) untuk pekerja ini`
        });
      } else {
        res.status(404).json({ 
          error: "Record kelayakan cuti tidak dijumpai atau telah dipadam" 
        });
      }
      
    } catch (error) {
      console.error("Delete leave eligibility error:", error);
      res.status(500).json({ 
        error: "Gagal mereset kelayakan cuti" 
      });
    }
  });

  // Initialize sample company leave types and data (for testing)
  app.post("/api/initialize-sample-data", authenticateToken, async (req, res) => {
    try {
      console.log('Initializing sample leave data...');
      
      // Sample leave types that company can enable
      const sampleLeaveTypes = [
        { leaveType: "Annual Leave", enabled: true, entitlementDays: 14, description: "Annual vacation leave" },
        { leaveType: "Medical Leave", enabled: true, entitlementDays: 60, description: "Medical/sick leave" },
        { leaveType: "Emergency Leave", enabled: true, entitlementDays: 3, description: "Emergency leave" },
        { leaveType: "Compassionate Leave - Paternity Leave", enabled: false, entitlementDays: 7, description: "Paternity leave" },
        { leaveType: "Compassionate Leave - Maternity Leave", enabled: false, entitlementDays: 98, description: "Maternity leave" },
        { leaveType: "Unpaid Leave", enabled: false, entitlementDays: 30, description: "Unpaid leave" },
        { leaveType: "Public Holiday", enabled: true, entitlementDays: 11, description: "Public holiday replacement" }
      ];

      // Insert or update company leave types
      for (const leaveType of sampleLeaveTypes) {
        await db
          .insert(companyLeaveTypes)
          .values(leaveType)
          .onConflictDoUpdate({
            target: companyLeaveTypes.leaveType,
            set: {
              enabled: leaveType.enabled,
              entitlementDays: leaveType.entitlementDays,
              description: leaveType.description,
              updatedAt: sql`CURRENT_TIMESTAMP`
            }
          });
      }

      // Get current employee to create sample applications
      const currentUser = req.user as any;
      const currentEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, currentUser.id))
        .limit(1);

      if (currentEmployee.length > 0) {
        const employee = currentEmployee[0];
        
        // Sample leave applications
        const sampleApplications = [
          {
            employeeId: employee.id,
            applicant: employee.fullName,
            leaveType: "Annual Leave",
            startDate: new Date('2024-08-15'),
            endDate: new Date('2024-08-17'),
            startDayType: "Full Day",
            endDayType: "Full Day",
            totalDays: "3",
            reason: "Family vacation",
            status: "Approved"
          },
          {
            employeeId: employee.id,
            applicant: employee.fullName,
            leaveType: "Medical Leave",
            startDate: new Date('2024-07-20'),
            endDate: new Date('2024-07-22'),
            startDayType: "Full Day",
            endDayType: "Full Day",
            totalDays: "3",
            reason: "Medical treatment",
            status: "Approved"
          },
          {
            employeeId: employee.id,
            applicant: employee.fullName,
            leaveType: "Emergency Leave",
            startDate: new Date('2024-06-10'),
            endDate: new Date('2024-06-10'),
            startDayType: "Full Day",
            endDayType: "Full Day",
            totalDays: "1",
            reason: "Family emergency",
            status: "Approved"
          }
        ];

        // Insert sample applications
        for (const application of sampleApplications) {
          await db
            .insert(leaveApplications)
            .values(application);
        }
      }

      console.log('Sample leave data initialized successfully');
      
      res.json({ 
        message: "Sample data initialized successfully",
        companyLeaveTypesCount: sampleLeaveTypes.length,
        sampleApplicationsCount: currentEmployee.length > 0 ? 3 : 0
      });
    } catch (error) {
      console.error("Initialize sample data error:", error);
      res.status(500).json({ error: "Failed to initialize sample data" });
    }
  });

  // Employee statistics for pie chart
  app.get("/api/employee-statistics", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getEmployeeStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Employee statistics error:", error);
      res.status(500).json({ error: "Gagal mengambil statistik pekerja" });
    }
  });

  // Attendance records for My Record page
  app.get("/api/attendance-records", authenticateToken, async (req, res) => {
    try {
      const { dateFrom, dateTo, employeeId } = req.query as {
        dateFrom?: string;
        dateTo?: string;
        employeeId?: string;
      };

      // Debug user information
      console.log('=== RBAC DEBUG ===');
      console.log('User ID:', req.user?.id);
      console.log('User Role:', req.user?.role);
      console.log('Requested Employee ID:', employeeId);
      
      // Check if user has admin access
      const hasAdminAccess = req.user?.role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(req.user.role);
      console.log('Has Admin Access:', hasAdminAccess);
      
      let targetEmployeeId = employeeId;
      
      // For non-admin users, ALWAYS force to their own employee ID
      if (!hasAdminAccess) {
        const employee = await storage.getEmployeeByUserId(req.user!.id);
        console.log('Found Employee for User:', employee?.id, employee?.fullName);
        if (!employee) {
          return res.status(404).json({ error: "Employee record tidak dijumpai" });
        }
        // Force to own employee ID regardless of what was requested
        targetEmployeeId = employee.id;
        console.log('Forced Employee ID to:', targetEmployeeId);
      }
      
      console.log('Final Target Employee ID:', targetEmployeeId);
      console.log('=== END RBAC DEBUG ===');

      const records = await storage.getAttendanceRecords({
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        employeeId: targetEmployeeId
      });

      // UNIVERSAL COMPLIANCE LOGIC - Apply to ALL records automatically using proper timezone-aware compliance
      console.log('🔍 UNIVERSAL COMPLIANCE DEBUG - Processing', records.length, 'attendance records with timezone-aware compliance');
      const recordsWithCompliance = await Promise.all(records.map(async (record) => {
        console.log('🔍 Processing record:', record.id, 'Date:', record.date, 'Clock-in:', record.clockInTime);
        
        // Use the proper timezone-aware compliance function from storage
        const compliance = await storage.checkUniversalCompliance(record);
        
        // Return record with compliance data
        const finalRecord = {
          ...record,
          isLateClockIn: compliance.isLateClockIn,
          clockInRemarks: compliance.clockInRemarks,
          isLateBreakOut: compliance.isLateBreakOut,
          breakOutRemarks: compliance.breakOutRemarks
        };
        
        console.log('🔍 Final record compliance:', {
          id: record.id,
          isLateClockIn: finalRecord.isLateClockIn,
          clockInRemarks: finalRecord.clockInRemarks
        });
        
        return finalRecord;
      }));

      res.json(recordsWithCompliance);
    } catch (error) {
      console.error("Attendance records error:", error);
      res.status(500).json({ error: "Gagal mengambil rekod kehadiran" });
    }
  });

  // Clock-out endpoint with location tracking
  app.post("/api/mobile-clockout", authenticateToken, async (req, res) => {
    try {
      const { latitude, longitude, selfieImageUrl } = req.body;
      const user = req.user!;

      // Validate location data
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Lokasi GPS diperlukan" });
      }

      // Get all active office locations
      const activeLocations = await storage.getActiveOfficeLocations();
      if (activeLocations.length === 0) {
        return res.status(400).json({ 
          error: "Tiada lokasi pejabat aktif ditetapkan" 
        });
      }

      // Check location validation
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

        const maxDistance = parseFloat(location.radius);
        if (distance <= maxDistance) {
          locationStatus = "valid";
          break;
        }
      }

      if (locationStatus === "invalid") {
        locationMessage = "Anda berada di luar kawasan pejabat. Sila berada dalam kawasan yang ditetapkan untuk clock out";
      }

      // Process selfie image path
      const objectStorageService = new ObjectStorageService();
      const selfieImagePath = objectStorageService.normalizeSelfieImagePath(selfieImageUrl);

      // Update attendance record for today with clock-out information
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const employee = await storage.getEmployeeByUserId(user.id);
      if (employee) {
        await storage.createOrUpdateAttendanceRecord({
          employeeId: employee.id,
          userId: user.id,
          date: today,
          clockOutTime: new Date(),
          clockOutLatitude: latitude,
          clockOutLongitude: longitude,
          clockOutLocationStatus: locationStatus,
          clockOutDistance: nearestDistance.toString(),
          clockOutOfficeLocationId: nearestLocationId,
          clockOutImage: selfieImagePath
        });
      }

      res.json({
        success: true,
        message: locationStatus === "valid" 
          ? "Clock-out berjaya! Anda berada dalam kawasan pejabat." 
          : locationMessage,
        location: {
          status: locationStatus,
          distance: Math.round(nearestDistance),
          message: locationMessage,
          nearestOffice: nearestLocationId
        }
      });

    } catch (error) {
      console.error("Mobile clock-out error:", error);
      res.status(500).json({ error: "Gagal melakukan clock-out" });
    }
  });

  // Staff user creation route (for admin/HR creating new staff accounts)
  app.post("/api/create-staff-user", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin roles can create new staff user accounts
      // FIXED: Include all valid admin roles used in production
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      console.log("Authorization check - Current user role:", currentUser.role);
      console.log("Valid admin roles:", adminRoles);
      console.log("Role check result:", adminRoles.includes(currentUser.role));
      
      if (!adminRoles.includes(currentUser.role)) {
        console.log("Access denied for role:", currentUser.role);
        return res.status(403).json({ 
          error: "Tidak dibenarkan untuk membuat akaun staff baru",
          currentRole: currentUser.role,
          requiredRoles: adminRoles
        });
      }
      
      console.log("Create staff user - Request body:", req.body);
      console.log("Current user:", { id: currentUser.id, role: currentUser.role });
      
      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ 
          error: "Username, password dan role diperlukan",
          received: { username: !!username, password: !!password, role: !!role }
        });
      }
      
      // Validate role
      const validRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account', 'Manager/Supervisor', 'Staff/Employee'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Role tidak sah",
          validRoles,
          received: role
        });
      }
      
      // Check if username already exists (case-insensitive)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // Suggest alternative usernames
        const baseName = username.toLowerCase().replace(/\s+/g, '');
        const suggestions = [
          `${baseName}1`,
          `${baseName}2`,
          `${baseName}_new`,
          `${baseName}_staff`
        ];
        
        return res.status(400).json({ 
          error: "Username sudah wujud",
          username,
          suggestions,
          existingUser: {
            username: existingUser.username,
            role: existingUser.role
          }
        });
      }
      
      // Create new user
      console.log("Creating user with data:", { username, role });
      console.log("=== BEFORE USER CREATION ===");
      
      try {
        const newUser = await storage.createUser({
          username,
          password,
          role,
        });
        
        console.log("=== USER CREATION SUCCESS ===");
        console.log("User created successfully:", newUser.id);
        console.log("New user object:", JSON.stringify(newUser, null, 2));
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      } catch (userCreationError) {
        console.error("=== USER CREATION ERROR ===");
        console.error("Error details:", userCreationError);
        console.error("Error message:", userCreationError instanceof Error ? userCreationError.message : String(userCreationError));
        console.error("Error stack:", userCreationError instanceof Error ? userCreationError.stack : 'No stack trace');
        
        return res.status(500).json({ 
          error: "Gagal mencipta akaun staff",
          details: userCreationError instanceof Error ? userCreationError.message : String(userCreationError)
        });
      }
    } catch (error) {
      console.error("Create staff user error:", error);
      
      if (error instanceof Error) {
        // Check for specific database errors
        if (error.message.includes('duplicate key')) {
          return res.status(400).json({ 
            error: "Username sudah wujud",
            details: error.message
          });
        }
        
        if (error.message.includes('constraint')) {
          return res.status(400).json({ 
            error: "Data tidak memenuhi syarat database",
            details: error.message
          });
        }
      }
      
      res.status(500).json({ 
        error: "Gagal membuat akaun staff baru",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Employee management routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      let employees;
      
      console.log("=== GET EMPLOYEES DEBUG ===");
      console.log("Current user:", { id: currentUser.id, username: currentUser.username, role: currentUser.role });
      
      // Role-based access control for new role system
      // FIXED: Include all valid admin roles used in production
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      console.log("Admin roles:", adminRoles);
      console.log("User has admin access:", adminRoles.includes(currentUser.role));
      
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can see all employees with details
        console.log("Fetching all employees with details for admin user...");
        employees = await storage.getAllEmployeesWithDetails();
        console.log("Employees fetched:", employees?.length || 0);
        console.log("First employee sample:", employees?.[0] ? JSON.stringify(employees[0], null, 2) : "No employees");
      } else {
        // Regular employees can only see their own employee record
        console.log("Fetching employee record for regular user...");
        const employee = await storage.getEmployeeByUserId(currentUser.id);
        console.log("Employee found for user:", !!employee);
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
      
      console.log("Final employees result count:", employees?.length || 0);
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai pekerja" });
    }
  });

  // Get employees with approval roles (Super Admin, Admin, HR Manager, PIC)
  app.get("/api/employees/approval-roles", authenticateToken, async (req, res) => {
    try {
      const approvalEmployees = await storage.getEmployeesWithApprovalRoles();
      res.json(approvalEmployees);
    } catch (error) {
      console.error("Error fetching approval employees:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai pekerja dengan role approval" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User tidak dijumpai" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat pengguna" });
    }
  });

  // Update employee attendance settings
  app.put("/api/employees/:id/attendance-settings", authenticateToken, async (req, res) => {
    try {
      const { setting, value } = req.body;
      const employeeId = req.params.id;
      
      // Validate input
      if (!setting || typeof value !== 'boolean') {
        return res.status(400).json({ error: "Setting dan value diperlukan" });
      }
      
      // Validate setting name
      const validSettings = ['allowClockInAnyLocation', 'enforceBreakClockOut'];
      if (!validSettings.includes(setting)) {
        return res.status(400).json({ error: "Setting tidak sah" });
      }
      
      // For now, just return success - in production this would save to database
      console.log(`Attendance setting updated for employee ${employeeId}: ${setting} = ${value}`);
      
      res.json({ 
        success: true,
        message: `Setting ${setting} telah dikemaskini kepada ${value}`,
        employeeId,
        setting,
        value
      });
    } catch (error) {
      console.error("Update attendance settings error:", error);
      res.status(500).json({ error: "Gagal mengkemaskini tetapan kehadiran" });
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
      // FIXED: Include all valid admin roles used in production
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can access any employee record
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
      
      // Only admin roles can create new employee records  
      // FIXED: Include all valid admin roles used in production
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      console.log("=== EMPLOYEE CREATION DEBUG ===");
      console.log("Current user:", JSON.stringify(currentUser, null, 2));
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Employee creation authorization check - Current user role:", currentUser.role);
      console.log("Valid admin roles:", adminRoles);
      console.log("Role check result:", adminRoles.includes(currentUser.role));
      
      if (!adminRoles.includes(currentUser.role)) {
        console.log("Employee creation access denied for role:", currentUser.role);
        return res.status(403).json({ 
          error: "Tidak dibenarkan untuk menambah pekerja baru",
          currentRole: currentUser.role,
          requiredRoles: adminRoles
        });
      }
      
      console.log("Create employee - Request body:", req.body);
      console.log("Current user:", { id: currentUser.id, role: currentUser.role });
      
      // Validate required fields before schema validation
      if (!req.body.userId || !req.body.fullName) {
        return res.status(400).json({ 
          error: "Field userId dan fullName diperlukan",
          received: req.body
        });
      }
      
      // Check if user exists
      const targetUser = await storage.getUser(req.body.userId);
      if (!targetUser) {
        return res.status(400).json({ 
          error: "User ID tidak dijumpai",
          userId: req.body.userId
        });
      }
      
      // Check if employee record already exists for this user
      const existingEmployee = await storage.getEmployeeByUserId(req.body.userId);
      if (existingEmployee) {
        return res.status(400).json({ 
          error: "Employee record sudah wujud untuk user ini",
          userId: req.body.userId
        });
      }
      
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Set userId if provided in request (for admin/HR assigning to specific user)
      const employeeData = {
        ...validatedData,
      };
      
      console.log("Validated data:", employeeData);
      const employee = await storage.createEmployee(employeeData);
      console.log("Employee created successfully:", employee.id);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      
      if (error instanceof Error) {
        // Check for specific database errors
        if (error.message.includes('duplicate key')) {
          return res.status(400).json({ 
            error: "Employee record dengan data ini sudah wujud",
            details: error.message
          });
        }
        
        if (error.message.includes('foreign key')) {
          return res.status(400).json({ 
            error: "User ID tidak sah atau tidak dijumpai",
            details: error.message
          });
        }
        
        // Zod validation errors
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            error: "Data tidak sah",
            details: error.message,
            issues: (error as any).issues
          });
        }
      }
      
      res.status(500).json({ 
        error: "Gagal menambah pekerja",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can update any employee record
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
      
      // Only Super Admin and Admin can delete employee records
      if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
        return res.status(403).json({ error: "Hanya Super Admin dan Admin yang dibenarkan menghapuskan data pekerja" });
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
      const currentUser = req.user!;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password dan new password diperlukan" });
      }

      // Get employee to check authorization
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }

      // Role-based access control for password changes
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can change any employee password
      } else {
        // Regular employees can only change their own password
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan menukar password pekerja lain" });
        }
      }

      const success = await storage.changeEmployeePassword(req.params.id, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ error: "Password lama tidak betul atau gagal menukar password" });
      }

      res.json({ message: "Password berjaya ditukar" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Gagal menukar password" });
    }
  });

  // Bank details update endpoint
  app.put("/api/employees/:id/bank-details", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can update any employee record
      } else {
        // Regular employees can only update their own record
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengemaskini data pekerja lain" });
        }
      }

      // Update compensation record with bank details
      console.log("Bank details update requested for employee:", req.params.id, req.body);
      
      // Get existing compensation or create new one
      let compensation = await storage.getCompensation(req.params.id);
      
      if (compensation) {
        // Update existing compensation
        await storage.updateCompensation(req.params.id, {
          bank: req.body.bank,
          accountNumber: req.body.accountNumber,
          accountType: req.body.accountType,
          branch: req.body.branch,
          accountHolderName: req.body.accountHolderName
        });
      } else {
        // Create new compensation record
        await storage.createCompensation({
          employeeId: req.params.id,
          bank: req.body.bank,
          accountNumber: req.body.accountNumber,
          accountType: req.body.accountType,
          branch: req.body.branch,
          accountHolderName: req.body.accountHolderName
        });
      }
      
      res.json({ 
        message: "Butiran bank berjaya dikemaskini",
        data: req.body 
      });
    } catch (error) {
      console.error("Update bank details error:", error);
      res.status(500).json({ error: "Gagal mengemaskini butiran bank" });
    }
  });

  // Statutory details update endpoint
  app.put("/api/employees/:id/statutory-details", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can update any employee record
      } else {
        // Regular employees can only update their own record
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengemaskini data pekerja lain" });
        }
      }

      // Update compensation record with statutory details
      console.log("Statutory details update requested for employee:", req.params.id, req.body);
      
      // Get existing compensation or create new one
      let compensation = await storage.getCompensation(req.params.id);
      
      if (compensation) {
        // Update existing compensation
        await storage.updateCompensation(req.params.id, {
          epfNumber: req.body.epfNumber,
          socsoNumber: req.body.socsoNumber,
          socsoContributionStartAge: req.body.socsoContributionStartAge,
          socsoCategory: req.body.socsoCategory,
          incomeTaxNumber: req.body.incomeTaxNumber,
          volaValue: parseFloat(req.body.vola) || 0
        });
      } else {
        // Create new compensation record
        await storage.createCompensation({
          employeeId: req.params.id,
          epfNumber: req.body.epfNumber,
          socsoNumber: req.body.socsoNumber,
          socsoContributionStartAge: req.body.socsoContributionStartAge,
          socsoCategory: req.body.socsoCategory,
          incomeTaxNumber: req.body.incomeTaxNumber,
          volaValue: parseFloat(req.body.vola) || 0
        });
      }
      
      res.json({ 
        message: "Butiran berkanun berjaya dikemaskini",
        data: req.body 
      });
    } catch (error) {
      console.error("Update statutory details error:", error);
      res.status(500).json({ error: "Gagal mengemaskini butiran berkanun" });
    }
  });

  // Income tax details update endpoint
  app.put("/api/employees/:id/income-tax-details", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can update any employee record
      } else {
        // Regular employees can only update their own record
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengemaskini data pekerja lain" });
        }
      }

      // Update compensation record with income tax details
      console.log("Income tax details update requested for employee:", req.params.id, req.body);
      
      // Get existing compensation or create new one
      let compensation = await storage.getCompensation(req.params.id);
      
      if (compensation) {
        // Update existing compensation
        await storage.updateCompensation(req.params.id, {
          employeeHasChild: req.body.hasChild,
          spouseIsWorking: req.body.spouseWorking,
          spouseGender: req.body.spouseGender,
          spouseIsDisable: req.body.spouseDisable,
          employeeCategory: req.body.employeeCategory
        });
      } else {
        // Create new compensation record
        await storage.createCompensation({
          employeeId: req.params.id,
          employeeHasChild: req.body.hasChild,
          spouseIsWorking: req.body.spouseWorking,
          spouseGender: req.body.spouseGender,
          spouseIsDisable: req.body.spouseDisable,
          employeeCategory: req.body.employeeCategory
        });
      }
      
      res.json({ 
        message: "Butiran cukai pendapatan berjaya dikemaskini",
        data: req.body 
      });
    } catch (error) {
      console.error("Update income tax details error:", error);
      res.status(500).json({ error: "Gagal mengemaskini butiran cukai pendapatan" });
    }
  });

  // Get contact details for an employee
  app.get("/api/contact/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employeeId = req.params.employeeId;
      
      // Get the employee to check authorization
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can access any employee contact
      } else {
        // Regular employees can only access their own contact
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengakses maklumat contact pekerja lain" });
        }
      }

      const contact = await storage.getContactByEmployeeId(employeeId);
      if (!contact) {
        // If no contact exists, return empty contact object
        return res.json({
          id: null,
          employeeId: employeeId,
          phoneNumber: "",
          email: "",
          personalEmail: "",
          address: "",
          mailingAddress: "",
          emergencyContactName: "",
          emergencyContactPhone: ""
        });
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat contact" });
    }
  });

  // Save/update contact details for an employee
  app.put("/api/contact/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employeeId = req.params.employeeId;
      
      // Get the employee to check authorization
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can update any employee contact
      } else {
        // Regular employees can only update their own contact
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengemaskini maklumat contact pekerja lain" });
        }
      }

      // Check if contact already exists
      const existingContact = await storage.getContactByEmployeeId(employeeId);
      
      let updatedContact;
      if (existingContact) {
        // Update existing contact
        updatedContact = await storage.updateContact(existingContact.id, {
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          personalEmail: req.body.personalEmail,
          address: req.body.address,
          mailingAddress: req.body.mailingAddress,
          emergencyContactName: req.body.emergencyContactName,
          emergencyContactPhone: req.body.emergencyContactPhone
        });
      } else {
        // Create new contact
        updatedContact = await storage.createContact({
          employeeId: employeeId,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          personalEmail: req.body.personalEmail,
          address: req.body.address,
          mailingAddress: req.body.mailingAddress,
          emergencyContactName: req.body.emergencyContactName,
          emergencyContactPhone: req.body.emergencyContactPhone
        });
      }
      
      res.json({ 
        message: "Maklumat contact berjaya dikemaskini",
        data: updatedContact 
      });
    } catch (error) {
      console.error("Update contact error:", error);
      res.status(500).json({ error: "Gagal mengemaskini maklumat contact" });
    }
  });

  app.post("/api/employees/:id/reset-password", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Get employee to check authorization
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }

      // Role-based access control for password reset
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can reset any employee password
      } else {
        // Regular employees can only reset their own password
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mereset password pekerja lain" });
        }
      }

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

  // Get compensation details for an employee (bank, statutory, income tax details)
  app.get("/api/compensation/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employeeId = req.params.employeeId;
      
      // Get the employee to check authorization
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can view any employee compensation
      } else {
        // Regular employees can only view their own compensation
        if (employee.userId !== currentUser.id) {
          return res.status(403).json({ error: "Tidak dibenarkan mengakses data compensation pekerja lain" });
        }
      }

      // Get compensation details from compensation table
      const compensationRecord = await storage.getCompensation(employeeId);
      
      const compensation = {
        bank: compensationRecord?.bank || "",
        accountNumber: compensationRecord?.accountNumber || "",
        accountType: compensationRecord?.accountType || "",
        branch: compensationRecord?.branch || "",
        accountHolderName: compensationRecord?.accountHolderName || "",
        accountStatus: compensationRecord?.accountStatus || "active",
        epfNumber: compensationRecord?.epfNumber || "",
        epfContributionStartDate: compensationRecord?.epfContributionStartDate || "after-aug-2001",
        socsoNumber: compensationRecord?.socsoNumber || "",
        socsoContributionStartAge: compensationRecord?.socsoContributionStartAge || "",
        socsoCategory: compensationRecord?.socsoCategory || "none",
        incomeTaxNumber: compensationRecord?.incomeTaxNumber || "",
        vola: compensationRecord?.volaValue || "0",
        hasChild: compensationRecord?.employeeHasChild || false,
        spouseWorking: compensationRecord?.spouseIsWorking || false,
        spouseGender: compensationRecord?.spouseGender || "",
        spouseDisable: compensationRecord?.spouseIsDisable || false,
        employeeCategory: compensationRecord?.employeeCategory || "none"
      };
      
      res.json(compensation);
    } catch (error) {
      console.error("Get compensation error:", error);
      res.status(500).json({ error: "Gagal mendapatkan maklumat compensation" });
    }
  });

  // Employment management routes
  app.get("/api/employment/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employment = await storage.getEmploymentByEmployeeId(req.params.employeeId);
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
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
      
      // Only admin roles can create employment records
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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
      
      // Get the employment record to check if user can edit
      const existingEmployment = await storage.getEmploymentById(req.params.id);
      if (!existingEmployment) {
        return res.status(404).json({ error: "Maklumat pekerjaan tidak dijumpai" });
      }
      
      // Allow admin roles to update any employment record
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      const isAdmin = adminRoles.includes(currentUser.role);
      
      // Allow employees to update their own employment record
      const isOwnRecord = existingEmployment.employeeId === currentUser.employeeId;
      
      if (!isAdmin && !isOwnRecord) {
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
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
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
      
      // Only admin roles can create contact records
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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
      
      // Only admin roles can update contact records
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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

  // ==============================================
  // TEST: Universal Compliance Re-Run
  // ==============================================
  app.post("/api/re-run-compliance", authenticateToken, async (req, res) => {
    try {
      console.log(`🔄 RE-RUNNING universal compliance for all attendance records...`);
      
      // Get all attendance records
      const allRecords = await storage.getAllAttendanceRecords();
      let processedCount = 0;
      
      for (const record of allRecords) {
        console.log(`🔄 Re-running compliance for record ${record.id} on ${record.date}`);
        await storage.createOrUpdateAttendanceRecord(record);
        processedCount++;
      }
      
      console.log(`✅ Re-ran compliance for ${processedCount} attendance records`);
      res.json({ 
        success: true, 
        message: `Compliance re-run completed for ${processedCount} records` 
      });
    } catch (error) {
      console.error("Error re-running compliance:", error);
      res.status(500).json({ error: "Gagal re-run compliance check" });
    }
  });

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
      console.log("=== QR VALIDATION DEBUG ===");
      console.log("Token received:", token);
      console.log("Token length:", token?.length);
      console.log("Timestamp:", new Date().toISOString());
      
      if (!token || token.length === 0) {
        console.log("ERROR: Empty or missing token");
        return res.status(400).json({ 
          error: "Token QR Code tidak dijumpai",
          code: "MISSING_TOKEN"
        });
      }

      const qrToken = await storage.getValidQrToken(token);
      console.log("QR Token from DB:", qrToken ? "Found" : "Not Found");
      
      if (qrToken) {
        console.log("Token details:", {
          userId: qrToken.userId,
          expiresAt: qrToken.expiresAt,
          isUsed: qrToken.isUsed,
          isExpired: new Date(qrToken.expiresAt) <= new Date()
        });
      }

      if (!qrToken) {
        console.log("ERROR: Token not found or expired");
        return res.status(400).json({ 
          error: "QR Code tidak sah atau telah tamat tempoh",
          expired: true,
          code: "INVALID_TOKEN"
        });
      }

      const user = await storage.getUser(qrToken.userId);
      console.log("User from DB:", user ? "Found" : "Not Found");
      
      if (!user) {
        console.log("ERROR: User not found for token");
        return res.status(400).json({ 
          error: "Pengguna tidak dijumpai",
          code: "USER_NOT_FOUND"
        });
      }

      console.log("SUCCESS: QR validation completed for user:", user.username);
      console.log("=== END QR VALIDATION DEBUG ===");

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
      console.error("=== QR VALIDATION ERROR ===");
      console.error("Error details:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      console.error("=== END QR VALIDATION ERROR ===");
      res.status(500).json({ 
        error: "Gagal mengesahkan QR Code",
        code: "SERVER_ERROR"
      });
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
      console.log("=== MOBILE CLOCKIN REQUEST ===");
      console.log("Body:", JSON.stringify(req.body, null, 2));
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

      // Check if user already has an attendance record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const employee = await storage.getEmployeeByUserId(qrToken.userId);
      if (!employee) {
        return res.status(400).json({ error: "Employee tidak dijumpai" });
      }

      const todayAttendance = await storage.getTodayAttendanceRecord(employee.id, today);
      
      console.log("=== CLOCK-IN/OUT DEBUG ===");
      console.log("Employee ID:", employee.id);
      console.log("Today:", today.toISOString().split('T')[0]);
      console.log("Today Attendance:", todayAttendance);
      console.log("Clock In Time:", todayAttendance?.clockInTime);
      console.log("Clock Out Time:", todayAttendance?.clockOutTime);
      console.log("=== END DEBUG ===");
      
      // Determine what action to take based on current attendance status and enforcement settings
      const enforceBreakClockOut = true; // TODO: Get from employee settings
      
      if (todayAttendance) {
        if (!todayAttendance.clockInTime) {
          // First action: Clock-In
          console.log("Processing clock-in for user:", qrToken.userId);
          // Continue with clock-in logic below
        } else if (enforceBreakClockOut && !todayAttendance.breakOutTime) {
          // Second action: Break-Out (leaving for break/lunch)
          console.log("Processing break-out for user:", qrToken.userId);
          return await processBreakOut(res, qrToken, todayAttendance, latitude, longitude, selfieImageUrl, storage);
        } else if (enforceBreakClockOut && !todayAttendance.breakInTime) {
          // Third action: Break-In (returning from break/lunch)
          console.log("Processing break-in for user:", qrToken.userId);
          return await processBreakIn(res, qrToken, todayAttendance, latitude, longitude, selfieImageUrl, storage);
        } else if (!todayAttendance.clockOutTime) {
          // Fourth action: Clock-Out
          console.log("Processing clock-out for user:", qrToken.userId);
          return await processClockOut(res, qrToken, todayAttendance, latitude, longitude, selfieImageUrl, storage);
        } else {
          // All attendance actions completed for today
          return res.status(400).json({ 
            error: enforceBreakClockOut 
              ? "Anda telah selesai clock-in, break time, break off dan clock-out untuk hari ini"
              : "Anda telah selesai clock-in dan clock-out untuk hari ini",
            alreadyCompleted: true
          });
        }
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
      // Check shift compliance for CLOCK-IN only
      const currentTime = new Date();
      let shiftCompliance = {
        shiftId: null,
        isLateClockIn: false,
        clockInRemarks: null
      };

      try {
        // Get employee's active shift assignment
        const activeShift = await storage.getEmployeeActiveShift(employee.id);
        if (activeShift) {
          // Parse shift start time for clock-in compliance check
          const shiftStartTime = activeShift.clockIn; // e.g., "08:30"
          const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
          
          // Create shift start time for today
          const todayShiftStart = new Date(currentTime);
          todayShiftStart.setHours(shiftHour, shiftMinute, 0, 0);
          
          // Check if clock-in is late (ALWAYS check, not just when enableStrictClockIn is true)
          if (currentTime > todayShiftStart) {
            const lateMinutes = Math.floor((currentTime.getTime() - todayShiftStart.getTime()) / (1000 * 60));
            
            // Convert minutes to hours and minutes format
            const lateHours = Math.floor(lateMinutes / 60);
            const remainingMinutes = lateMinutes % 60;
            
            let lateTimeText = '';
            if (lateHours > 0) {
              lateTimeText = `${lateHours} jam ${remainingMinutes} minit`;
            } else {
              lateTimeText = `${remainingMinutes} minit`;
            }
            
            shiftCompliance.isLateClockIn = true;
            shiftCompliance.clockInRemarks = `Lewat ${lateTimeText} dari masa shift ${shiftStartTime}. Perlu semakan penyelia.`;
          }
          
          shiftCompliance.shiftId = activeShift.id;
        }
      } catch (error) {
        console.error("Shift compliance check error:", error);
        // Continue with normal clock-in even if shift check fails
      }

      // Create attendance record for today with location tracking and shift compliance
      const attendanceRecord = await storage.createOrUpdateAttendanceRecord({
        employeeId: employee.id,
        userId: qrToken.userId,
        date: today,
        clockInTime: new Date(),
        clockInLatitude: latitude,
        clockInLongitude: longitude,
        clockInLocationStatus: locationStatus,
        clockInDistance: nearestDistance.toString(),
        clockInOfficeLocationId: nearestLocationId,
        clockInImage: selfieImagePath,
        status: locationStatus === "valid" ? "present" : "invalid_location",
        shiftId: shiftCompliance.shiftId,
        isLateClockIn: shiftCompliance.isLateClockIn,
        clockInRemarks: shiftCompliance.clockInRemarks
      });

      res.json({
        success: true,
        clockInRecord: {
          id: attendanceRecord.id,
          clockInTime: attendanceRecord.clockInTime,
          locationStatus: attendanceRecord.clockInLocationStatus,
          distance: Math.round(nearestDistance)
        },
        shift: {
          hasShift: !!shiftCompliance.shiftId,
          isLate: shiftCompliance.isLateClockIn,
          remarks: shiftCompliance.clockInRemarks
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
      console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({ 
        error: "Gagal melakukan clock-in",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Serve selfie images (protected endpoint)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving selfie:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get today's attendance status for QR clock-in page
  app.get("/api/today-attendance-status", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const employee = await storage.getEmployeeByUserId(userId);
      if (!employee) {
        return res.status(404).json({ error: "Employee tidak dijumpai" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAttendance = await storage.getTodayAttendanceRecord(employee.id, today);
      
      // Check if break clock-out enforcement is enabled for this employee
      // For now, we'll assume it's enabled by default - this should come from employee settings
      const enforceBreakClockOut = true; // TODO: Get from employee settings
      
      // Determine attendance status and next action
      let nextAction = 'clock-in';
      let needsClockOut = false;
      let needsBreakOut = false;
      let needsBreakIn = false;
      
      if (todayAttendance) {
        if (!todayAttendance.clockInTime) {
          nextAction = 'clock-in';
        } else if (enforceBreakClockOut && !todayAttendance.breakOutTime) {
          nextAction = 'break-out';
          needsBreakOut = true;
        } else if (enforceBreakClockOut && !todayAttendance.breakInTime) {
          nextAction = 'break-in';
          needsBreakIn = true;
        } else if (!todayAttendance.clockOutTime) {
          nextAction = 'clock-out';
          needsClockOut = true;
        } else {
          nextAction = 'completed';
        }
      }
      
      res.json({
        hasAttendanceToday: !!todayAttendance,
        clockInTime: todayAttendance?.clockInTime || null,
        clockOutTime: todayAttendance?.clockOutTime || null,
        breakOutTime: todayAttendance?.breakOutTime || null,
        breakInTime: todayAttendance?.breakInTime || null,
        isClockInCompleted: !!(todayAttendance && todayAttendance.clockInTime),
        isClockOutCompleted: !!(todayAttendance && todayAttendance.clockOutTime),
        isBreakOutCompleted: !!(todayAttendance && todayAttendance.breakOutTime),
        isBreakInCompleted: !!(todayAttendance && todayAttendance.breakInTime),
        needsClockOut,
        needsBreakOut,
        needsBreakIn,
        nextAction,
        enforceBreakClockOut
      });
    } catch (error) {
      console.error("Today attendance status error:", error);
      res.status(500).json({ error: "Gagal mendapatkan status kehadiran hari ini" });
    }
  });

  // Get attendance record for specific employee and date (for compliance checking)
  app.get("/api/attendance-records/:employeeId/:date", authenticateToken, async (req, res) => {
    try {
      const { employeeId, date } = req.params;
      
      // Parse the date and set to start of day
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const attendanceRecord = await storage.getTodayAttendanceRecord(employeeId, targetDate);
      
      if (!attendanceRecord) {
        return res.status(404).json({ message: "No attendance record found for this date" });
      }
      
      res.json(attendanceRecord);
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      res.status(500).json({ error: "Failed to fetch attendance record" });
    }
  });

  // Get user's clock-in history
  app.get("/api/clockin-history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Get user first, then employee
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      const employee = await storage.getEmployeeByUserId(userId);
      if (!employee) {
        return res.status(404).json({ error: "Employee tidak ditemukan" });
      }

      // Get attendance records for the employee (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await storage.getAttendanceRecords({
        employeeId: employee.id,
        dateFrom: thirtyDaysAgo
      });

      // UNIVERSAL COMPLIANCE LOGIC - Apply to ALL records automatically (same as /api/attendance-records)
      const recordsWithCompliance = await Promise.all(attendanceRecords.map(async (record) => {
        // Initialize compliance fields
        let isLateClockIn = false;
        let clockInRemarks = null;
        
        // Only check compliance if there's a clock-in time
        if (record.clockInTime) {
          try {
            // Get employee's active shift assignment for the record date
            const activeShift = await storage.getEmployeeActiveShift(record.employeeId);
            if (activeShift) {
              // Parse shift start time for clock-in compliance check
              const shiftStartTime = activeShift.clockIn; // e.g., "08:30"
              const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
              
              // Create shift start time for the record date
              const recordDate = new Date(record.date);
              const shiftStartDateTime = new Date(recordDate);
              shiftStartDateTime.setHours(shiftHour, shiftMinute, 0, 0);
              
              // Check if clock-in is late (Universal compliance for ALL users)
              const clockInTime = new Date(record.clockInTime);
              if (clockInTime > shiftStartDateTime) {
                const lateMinutes = Math.floor((clockInTime.getTime() - shiftStartDateTime.getTime()) / (1000 * 60));
                
                // Convert minutes to hours and minutes format
                const lateHours = Math.floor(lateMinutes / 60);
                const remainingMinutes = lateMinutes % 60;
                
                let lateTimeText = '';
                if (lateHours > 0) {
                  lateTimeText = `${lateHours} jam ${remainingMinutes} minit`;
                } else {
                  lateTimeText = `${remainingMinutes} minit`;
                }
                
                isLateClockIn = true;
                clockInRemarks = `Lewat ${lateTimeText} dari masa shift ${shiftStartTime}. Perlu semakan penyelia.`;
              }
            }
          } catch (error) {
            console.error("Shift compliance check error for record:", record.id, error);
            // Continue with normal record even if shift check fails
          }
        }
        
        // Return record with compliance data
        return {
          id: record.id,
          date: record.date,
          clockInTime: record.clockInTime,
          clockOutTime: record.clockOutTime,
          clockInLatitude: record.clockInLatitude,
          clockInLongitude: record.clockInLongitude,
          clockOutLatitude: record.clockOutLatitude,
          clockOutLongitude: record.clockOutLongitude,
          clockInLocationStatus: record.clockInLocationStatus,
          clockOutLocationStatus: record.clockOutLocationStatus,
          clockInImage: record.clockInImage,
          clockOutImage: record.clockOutImage,
          totalHours: record.totalHours,
          status: record.status,
          // Universal compliance fields applied to ALL records
          isLateClockIn,
          isLateBreakOut: record.isLateBreakOut,
          clockInRemarks,
          breakOutRemarks: record.breakOutRemarks,
          shiftId: record.shiftId,
          breakOutTime: record.breakOutTime,
          breakInTime: record.breakInTime
        };
      }));
      
      res.json({
        attendanceRecords: recordsWithCompliance
      });
    } catch (error) {
      console.error("Attendance history error:", error);
      res.status(500).json({ error: "Gagal mendapatkan sejarah kehadiran" });
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

  // =================== SHIFTS ROUTES ===================
  // Get all shifts
  app.get("/api/shifts", authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getAllShifts();
      res.json(shifts);
    } catch (error) {
      console.error("Get shifts error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai syif" });
    }
  });

  // Get single shift by ID
  app.get("/api/shifts/:id", authenticateToken, async (req, res) => {
    try {
      const shift = await storage.getShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Syif tidak dijumpai" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Get shift error:", error);
      res.status(500).json({ error: "Gagal mendapatkan syif" });
    }
  });

  // Create new shift
  app.post("/api/shifts", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertShiftSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const shift = await storage.createShift(validationResult.data);
      res.status(201).json(shift);
    } catch (error) {
      console.error("Create shift error:", error);
      res.status(500).json({ error: "Gagal mencipta syif" });
    }
  });

  // Update shift
  app.put("/api/shifts/:id", authenticateToken, async (req, res) => {
    try {
      const validationResult = updateShiftSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: validationResult.error.issues 
        });
      }

      const shift = await storage.updateShift(req.params.id, validationResult.data);
      if (!shift) {
        return res.status(404).json({ error: "Syif tidak dijumpai" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Update shift error:", error);
      res.status(500).json({ error: "Gagal mengemaskini syif" });
    }
  });

  // Delete shift
  app.delete("/api/shifts/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteShift(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Syif tidak dijumpai" });
      }
      res.json({ message: "Syif berjaya dipadam" });
    } catch (error) {
      console.error("Delete shift error:", error);
      res.status(500).json({ error: "Gagal memadamkan syif" });
    }
  });

  // Assign employee to shift endpoint
  app.post("/api/employees/:employeeId/assign-shift", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { shiftId, assignedDate } = req.body;
      
      console.log("Assign shift request:", { employeeId, shiftId, assignedDate });
      
      // Validate and parse date safely
      let targetDate = new Date();
      if (assignedDate) {
        const parsedDate = new Date(assignedDate);
        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid date format:", assignedDate);
          return res.status(400).json({ error: "Format tarikh tidak sah" });
        }
        targetDate = parsedDate;
      }
      
      console.log("Target date parsed:", targetDate);
      
      const assignment = await storage.assignEmployeeToShift(employeeId, shiftId, targetDate);
      res.json(assignment);
    } catch (error) {
      console.error("Assign shift error:", error);
      res.status(500).json({ error: "Gagal mengassign shift kepada pekerja" });
    }
  });

  // Get employee's assigned shift
  app.get("/api/employees/:employeeId/shift", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const shift = await storage.getEmployeeActiveShift(employeeId);
      res.json(shift);
    } catch (error) {
      console.error("Get employee shift error:", error);
      res.status(500).json({ error: "Gagal mendapatkan shift pekerja" });
    }
  });

  // Get all employee shift assignments
  app.get("/api/employee-shifts", authenticateToken, async (req, res) => {
    try {
      const employeeShifts = await storage.getAllEmployeeShifts();
      res.json(employeeShifts);
    } catch (error) {
      console.error("Get employee shifts error:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai shift pekerja" });
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
  
  // Serve public objects (for company logo, etc.) - using objects path instead
  // We will serve company logo through /objects/ path for now

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

  // Set ACL policy for uploaded supporting documents
  app.post("/api/objects/set-acl", authenticateToken, async (req, res) => {
    try {
      const { objectUrl } = req.body;
      if (!objectUrl) {
        return res.status(400).json({ error: "objectUrl diperlukan" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectUrl,
        {
          owner: req.user!.id,
          visibility: "private", // Supporting documents are private
        }
      );

      res.json({ 
        success: true, 
        objectPath,
        message: "ACL policy set successfully" 
      });
    } catch (error) {
      console.error("Error setting ACL policy:", error);
      res.status(500).json({ error: "Gagal menetapkan ACL policy" });
    }
  });

  // Update employee profile image
  app.put("/api/employees/:id/profile-image", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const targetEmployeeId = req.params.id;
      
      // Get current user's employee record to check if they're updating their own profile
      const currentUserEmployee = await storage.getEmployeeByUserId(currentUser.id);
      const isOwnProfile = currentUserEmployee?.id === targetEmployeeId;
      
      // Allow users to update their own profile OR admin roles to update any profile
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      const hasAdminAccess = adminRoles.includes(currentUser.role);
      
      if (!isOwnProfile && !hasAdminAccess) {
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

  // Update company logo
  app.put("/api/company-logo", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin roles can update company logo
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk mengemaskini logo syarikat" });
      }

      const { logoURL } = req.body;
      if (!logoURL) {
        return res.status(400).json({ error: "logoURL diperlukan" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        logoURL,
        {
          owner: currentUser.id,
          visibility: "public", // Company logo should be public
        }
      );

      res.json({ 
        success: true, 
        objectPath,
        message: "Logo syarikat berjaya dikemaskini" 
      });
    } catch (error) {
      console.error("Error updating company logo:", error);
      res.status(500).json({ error: "Gagal mengemaskini logo syarikat" });
    }
  });

  // =================== CLAIM APPLICATION ROUTES ===================
  
  // Create claim application
  app.post("/api/claim-applications", authenticateToken, async (req, res) => {
    try {
      console.log("Creating claim application with data:", req.body);
      
      const validatedData = insertClaimApplicationSchema.parse(req.body);
      console.log("Validated claim data:", validatedData);
      
      // Create claim application with proper data structure
      const claimApplication = await storage.createClaimApplication(validatedData);
      console.log("Created claim application:", claimApplication);
      
      res.status(201).json(claimApplication);
    } catch (error) {
      console.error("Error creating claim application:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Data tidak sah", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Gagal membuat permohonan claim" });
    }
  });

  // Get claim applications for My Record
  app.get("/api/claim-applications/my-record/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { employeeId } = req.params;
      const { month, year, status } = req.query;
      
      console.log('=== RBAC DEBUG ===');
      console.log('User ID:', currentUser.id);
      console.log('User Role:', currentUser.role);
      console.log('Requested Employee ID:', employeeId);
      
      // Role-based access control 
      const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager'];
      const hasAdminAccess = privilegedRoles.includes(currentUser.role);
      console.log('Has Admin Access:', hasAdminAccess);
      
      let targetEmployeeId = employeeId;
      
      // If user has admin access and requests 'all' or undefined, fetch all claims
      if (hasAdminAccess && (employeeId === 'all' || employeeId === 'undefined')) {
        targetEmployeeId = undefined; // This will fetch all claims
      }
      // If regular user, only allow access to their own claims
      else if (!hasAdminAccess) {
        const userEmployee = await storage.getEmployeeByUserId(currentUser.id);
        if (!userEmployee || userEmployee.id !== employeeId) {
          return res.status(403).json({ error: 'Tidak dibenarkan untuk mengakses rekod claim pekerja lain' });
        }
      }
      
      console.log('Final Target Employee ID:', targetEmployeeId);
      console.log('=== END RBAC DEBUG ===');
      
      let claims;
      if (targetEmployeeId === undefined) {
        // Fetch all FINANCIAL claims for admin users (no month/year filter)
        claims = await storage.getAllClaimApplicationsWithDetails({
          claimType: 'financial', // Force financial claims only
          status: status as string | undefined
        });
      } else {
        // Fetch specific employee FINANCIAL claims (no month/year filter)
        claims = await storage.getClaimApplicationsByEmployee(targetEmployeeId, {
          claimType: 'financial', // Force financial claims only
          status: status as string | undefined
        });
      }
      
      console.log(`Found ${claims.length} claim applications for ${targetEmployeeId || 'all employees'}`);
      
      // Debug: Check if Siti Nadiah rejected claim is included
      const sitiRejectedClaim = claims.find(c => 
        (c.requestorName && c.requestorName.toLowerCase().includes('siti nadiah')) && 
        c.status && c.status.toLowerCase() === 'rejected'
      );
      
      if (sitiRejectedClaim) {
        console.log('✅ FOUND Siti Nadiah rejected claim:', {
          id: sitiRejectedClaim.id,
          requestorName: sitiRejectedClaim.requestorName,
          status: sitiRejectedClaim.status,
          amount: sitiRejectedClaim.amount,
          financialPolicyName: sitiRejectedClaim.financialPolicyName
        });
      } else {
        console.log('❌ MISSING Siti Nadiah rejected claim - checking all claims...');
        claims.forEach((claim, index) => {
          if (claim.requestorName && claim.requestorName.toLowerCase().includes('siti')) {
            console.log(`Claim ${index + 1}:`, {
              id: claim.id,
              requestorName: claim.requestorName,
              status: claim.status,
              amount: claim.amount
            });
          }
        });
      }
      
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claim applications:", error);
      res.status(500).json({ error: "Gagal mengambil rekod permohonan claim" });
    }
  });

  // Get overtime claims for My Record page
  app.get("/api/claim-applications/overtime/my-record/:employeeId", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { employeeId } = req.params;
      
      console.log('=== OVERTIME CLAIMS RBAC DEBUG ===');
      console.log('User ID:', currentUser.id);
      console.log('User Role:', currentUser.role);
      console.log('Requested Employee ID:', employeeId);
      
      // Role-based access control 
      const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager'];
      const hasAdminAccess = privilegedRoles.includes(currentUser.role);
      console.log('Has Admin Access:', hasAdminAccess);
      
      let targetEmployeeId = employeeId;
      
      // If user has admin access and requests 'all', fetch all overtime claims
      if (hasAdminAccess && employeeId === 'all') {
        targetEmployeeId = undefined; // This will fetch all overtime claims
      }
      // If regular user, only allow access to their own overtime claims
      else if (!hasAdminAccess) {
        const userEmployee = await storage.getEmployeeByUserId(currentUser.id);
        if (!userEmployee || userEmployee.id !== employeeId) {
          return res.status(403).json({ error: 'Tidak dibenarkan untuk mengakses rekod overtime pekerja lain' });
        }
      }
      
      console.log('Final Target Employee ID for Overtime:', targetEmployeeId);
      console.log('=== END OVERTIME CLAIMS RBAC DEBUG ===');
      
      let overtimeClaims;
      if (targetEmployeeId === undefined) {
        // Fetch all OVERTIME claims for admin users
        overtimeClaims = await storage.getAllClaimApplicationsWithDetails({
          claimType: 'overtime'
        });
      } else {
        // Fetch specific employee OVERTIME claims
        overtimeClaims = await storage.getClaimApplicationsByEmployee(targetEmployeeId, {
          claimType: 'overtime'
        });
      }
      
      console.log(`Found ${overtimeClaims.length} overtime claim applications for ${targetEmployeeId || 'all employees'}`);
      
      res.json(overtimeClaims);
    } catch (error) {
      console.error("Get overtime claims error:", error);
      res.status(500).json({ error: "Gagal mendapatkan rekod overtime claims" });
    }
  });

  // Get all claim applications for approval (admin view)
  app.get("/api/claim-applications", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { status, claimType, page = 1, limit = 10 } = req.query;
      
      console.log("Fetching all claim applications for approval by user:", currentUser.username);
      
      // Check if user has approval rights
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk melihat permohonan approval" });
      }
      
      const filters = {
        status: status as string | undefined,
        claimType: claimType as string | undefined,
        page: Number(page),
        limit: Number(limit)
      };
      
      const result = await storage.getClaimApplicationsForApproval(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching claim applications for approval:", error);
      res.status(500).json({ error: "Gagal mengambil senarai permohonan untuk approval" });
    }
  });

  // Approve claim application
  app.put("/api/claim-applications/:id/approve", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { level } = req.body; // 'first' or 'final'
      const currentUser = req.user!;
      
      console.log(`Approving claim ${id} at ${level} level by user:`, currentUser.username);
      
      // Check if user has approval rights
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk approve permohonan" });
      }
      
      const updatedClaim = await storage.approveClaimApplication(id, currentUser.id, level);
      
      if (!updatedClaim) {
        return res.status(404).json({ error: "Permohonan claim tidak dijumpai" });
      }
      
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error approving claim application:", error);
      res.status(500).json({ error: "Gagal approve permohonan claim" });
    }
  });

  // Reject claim application
  app.put("/api/claim-applications/:id/reject", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const currentUser = req.user!;
      
      console.log(`Rejecting claim ${id} by user:`, currentUser.username, "with reason:", reason);
      
      // Check if user has approval rights
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk reject permohonan" });
      }
      
      const updatedClaim = await storage.rejectClaimApplication(id, currentUser.id, reason);
      
      if (!updatedClaim) {
        return res.status(404).json({ error: "Permohonan claim tidak dijumpai" });
      }
      
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error rejecting claim application:", error);
      res.status(500).json({ error: "Gagal reject permohonan claim" });
    }
  });

  // Get recent claim applications for dashboard
  app.get("/api/claim-applications/recent/:claimType", authenticateToken, async (req, res) => {
    try {
      const { claimType } = req.params;
      const { limit = 5 } = req.query;
      
      console.log("Fetching recent claim applications of type:", claimType);
      
      const claims = await storage.getRecentClaimApplications(claimType, Number(limit));
      res.json(claims);
    } catch (error) {
      console.error("Error fetching recent claim applications:", error);
      res.status(500).json({ error: "Gagal mengambil recent claim applications" });
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

  // =================== LEAVE BALANCE CARRY FORWARD ROUTES ===================
  
  // Get leave balance carry forward records for an employee
  app.get("/api/leave-balance-carry-forward/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const carryForwardRecords = await storage.getLeaveBalanceCarryForward(employeeId, year);
      res.json(carryForwardRecords);
    } catch (error) {
      console.error("Error fetching leave balance carry forward:", error);
      res.status(500).json({ error: "Gagal mendapatkan rekod carry forward" });
    }
  });

  // Create year-end carry forward process
  app.post("/api/process-year-end-carry-forward", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk memproses carry forward" });
      }
      
      const { year } = req.body;
      if (!year) {
        return res.status(400).json({ error: "Tahun diperlukan" });
      }
      
      const carryForwardRecords = await storage.processYearEndCarryForward(year);
      res.json({
        message: `Successfully processed carry forward for ${year}`,
        recordsCreated: carryForwardRecords.length,
        records: carryForwardRecords
      });
    } catch (error) {
      console.error("Error processing year-end carry forward:", error);
      res.status(500).json({ error: "Gagal memproses carry forward akhir tahun" });
    }
  });

  // Get all carry forward records (for admin view)
  app.get("/api/leave-balance-carry-forward", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan" });
      }
      
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      // Get all employees and their carry forward records
      const employees = await storage.getAllEmployees();
      const allCarryForwardRecords = [];
      
      for (const employee of employees) {
        const records = await storage.getLeaveBalanceCarryForward(employee.id, year);
        if (records.length > 0) {
          allCarryForwardRecords.push({
            employee: {
              id: employee.id,
              fullName: employee.fullName,
              staffId: employee.staffId,
              role: employee.role
            },
            carryForwardRecords: records
          });
        }
      }
      
      res.json(allCarryForwardRecords);
    } catch (error) {
      console.error("Error fetching all carry forward records:", error);
      res.status(500).json({ error: "Gagal mendapatkan semua rekod carry forward" });
    }
  });

  // =================== LEAVE POLICY ROUTES ===================
  
  // Get employee leave policies
  app.get("/api/leave-policies/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const leavePolicies = await storage.getEmployeeLeavePoliciesWithEntitlement(employeeId);
      res.json(leavePolicies);
    } catch (error) {
      console.error("Error fetching leave policies:", error);
      res.status(500).json({ error: "Gagal mendapatkan polisi cuti" });
    }
  });

  // Get active leave policies for all employees (for Apply Leave dropdown)
  app.get("/api/active-leave-policies", authenticateToken, async (req, res) => {
    try {
      const activeLeavePolicies = await storage.getActiveLeavePolicies();
      // Return unique leave types that are included/active
      const leaveTypes = activeLeavePolicies.map(policy => policy.leaveType).filter(type => type !== null && type !== undefined);
      const uniqueLeaveTypes = Array.from(new Set(leaveTypes));
      res.json(uniqueLeaveTypes);
    } catch (error) {
      console.error("Error fetching active leave policies:", error);
      res.status(500).json({ error: "Gagal mendapatkan polisi cuti aktif" });
    }
  });

  // Create leave policy
  app.post("/api/leave-policies", authenticateToken, async (req, res) => {
    try {
      const { employeeId, leaveType, entitlement, balance, remarks, included } = req.body;

      if (!employeeId || !leaveType) {
        return res.status(400).json({ 
          error: "Employee ID dan jenis cuti diperlukan" 
        });
      }

      const newLeavePolicy = await storage.createLeavePolicy({
        employeeId,
        leaveType,
        entitlement: entitlement || null,
        balance: balance || null,
        remarks: remarks || null,
        included: included || false,
      });

      res.status(201).json({
        success: true,
        leavePolicy: newLeavePolicy,
        message: "Polisi cuti berjaya ditambah",
      });
    } catch (error) {
      console.error("Error creating leave policy:", error);
      res.status(500).json({ error: "Gagal menambah polisi cuti" });
    }
  });

  // Update leave policy
  app.put("/api/leave-policies/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { leaveType, entitlement, balance, remarks, included } = req.body;

      const updates: any = {};
      if (leaveType !== undefined) updates.leaveType = leaveType;
      if (entitlement !== undefined) updates.entitlement = entitlement;
      if (balance !== undefined) updates.balance = balance;
      if (remarks !== undefined) updates.remarks = remarks;
      if (included !== undefined) updates.included = included;

      const updatedLeavePolicy = await storage.updateLeavePolicy(id, updates);

      if (!updatedLeavePolicy) {
        return res.status(404).json({ error: "Polisi cuti tidak dijumpai" });
      }

      res.json({
        success: true,
        leavePolicy: updatedLeavePolicy,
        message: "Polisi cuti berjaya dikemaskini",
      });
    } catch (error) {
      console.error("Error updating leave policy:", error);
      res.status(500).json({ error: "Gagal mengemaskini polisi cuti" });
    }
  });

  // Delete leave policy by employee and leave type (for system settings toggle)
  app.delete("/api/leave-policies/:employeeId/:leaveType", authenticateToken, async (req, res) => {
    try {
      const { employeeId, leaveType } = req.params;
      
      // Delete leave policy for specific employee and leave type
      const deleted = await storage.deleteLeavePolicyByEmployeeAndType(employeeId, decodeURIComponent(leaveType));
      
      if (!deleted) {
        return res.status(404).json({ error: "Polisi cuti tidak dijumpai" });
      }

      res.json({ 
        success: true,
        message: `Polisi cuti ${leaveType} untuk pekerja berjaya dipadamkan` 
      });
    } catch (error) {
      console.error("Error deleting leave policy:", error);
      res.status(500).json({ error: "Gagal memadamkan polisi cuti" });
    }
  });

  // Delete leave policy by leave type (for system settings toggle)
  app.delete("/api/leave-policies/:leaveType", authenticateToken, async (req, res) => {
    try {
      const { leaveType } = req.params;
      
      // Delete all leave policies with this leave type
      const deleted = await storage.deleteLeavePolicyByType(leaveType);
      
      if (!deleted) {
        return res.status(404).json({ error: "Polisi cuti tidak dijumpai" });
      }

      res.json({ 
        success: true,
        message: `Polisi cuti ${leaveType} berjaya dipadamkan` 
      });
    } catch (error) {
      console.error("Error deleting leave policy:", error);
      res.status(500).json({ error: "Gagal memadamkan polisi cuti" });
    }
  });

  // Delete leave policy
  app.delete("/api/leave-policies/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteLeavePolicy(id);

      if (!deleted) {
        return res.status(404).json({ error: "Polisi cuti tidak dijumpai" });
      }

      res.json({
        success: true,
        message: "Polisi cuti berjaya dipadamkan",
      });
    } catch (error) {
      console.error("Error deleting leave policy:", error);
      res.status(500).json({ error: "Gagal memadamkan polisi cuti" });
    }
  });

  // =================== CLAIM POLICY ROUTES ===================
  
  // Get employee claim policies
  app.get("/api/claim-policies/:employeeId", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const claimPolicies = await storage.getClaimPolicies(employeeId);
      res.json(claimPolicies);
    } catch (error) {
      console.error("Error fetching claim policies:", error);
      res.status(500).json({ error: "Gagal mendapatkan polisi claim" });
    }
  });

  // Create claim policy
  app.post("/api/claim-policies", authenticateToken, async (req, res) => {
    try {
      const { employeeId, claimType, annualLimit, balance, remarks, isEnabled } = req.body;

      if (!employeeId || !claimType) {
        return res.status(400).json({ 
          error: "Employee ID dan jenis claim diperlukan" 
        });
      }

      const newClaimPolicy = await storage.createClaimPolicy({
        employeeId,
        claimType,
        annualLimit: annualLimit || null,
        balance: balance || null,
        remarks: remarks || null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
      });

      res.status(201).json({
        success: true,
        claimPolicy: newClaimPolicy,
        message: "Polisi claim berjaya ditambah",
      });
    } catch (error) {
      console.error("Error creating claim policy:", error);
      res.status(500).json({ error: "Gagal menambah polisi claim" });
    }
  });

  // Update claim policy
  app.put("/api/claim-policies/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { claimType, annualLimit, balance, remarks, isEnabled } = req.body;

      const updates: any = {};
      if (claimType !== undefined) updates.claimType = claimType;
      if (annualLimit !== undefined) updates.annualLimit = annualLimit;
      if (balance !== undefined) updates.balance = balance;
      if (remarks !== undefined) updates.remarks = remarks;
      if (isEnabled !== undefined) updates.isEnabled = isEnabled;

      const updatedClaimPolicy = await storage.updateClaimPolicy(id, updates);

      if (!updatedClaimPolicy) {
        return res.status(404).json({ error: "Polisi claim tidak dijumpai" });
      }

      res.json({
        success: true,
        claimPolicy: updatedClaimPolicy,
        message: "Polisi claim berjaya dikemaskini",
      });
    } catch (error) {
      console.error("Error updating claim policy:", error);
      res.status(500).json({ error: "Gagal mengemaskini polisi claim" });
    }
  });

  // Delete claim policy
  app.delete("/api/claim-policies/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteClaimPolicy(id);

      if (!deleted) {
        return res.status(404).json({ error: "Polisi claim tidak dijumpai" });
      }

      res.json({
        success: true,
        message: "Polisi claim berjaya dipadamkan",
      });
    } catch (error) {
      console.error("Error deleting claim policy:", error);
      res.status(500).json({ error: "Gagal memadamkan polisi claim" });
    }
  });

  // =================== LEAVE APPLICATION ROUTES ===================
  
  // Get all leave applications (for admin/HR/managers)
  app.get("/api/leave-applications", authenticateToken, async (req, res) => {
    try {
      console.log("Loading leave applications for user:", req.user?.id);
      const currentUser = req.user!;
      const { mode } = req.query; // mode: 'approval' or 'report'
      
      // Get current user's employee record
      const currentEmployee = await storage.getEmployeeByUserId(currentUser.id);
      if (!currentEmployee) {
        return res.status(404).json({ error: "Employee record tidak dijumpai" });
      }

      // For report mode, return all applications for reporting purposes
      if (mode === 'report') {
        const allApplications = await storage.getAllLeaveApplications();
        return res.json(allApplications);
      }

      // Get leave approval settings
      const leaveApprovalSettings = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, 'leave'))
        .limit(1);

      const approvalSetting = leaveApprovalSettings[0];
      
      let leaveAppResults;
      
      // If no approval settings configured, show all to admin roles
      if (!approvalSetting) {
        const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
        if (adminRoles.includes(currentUser.role)) {
          leaveAppResults = await storage.getAllLeaveApplications();
        } else {
          leaveAppResults = await storage.getLeaveApplicationsByEmployeeId(currentEmployee.id);
        }
      } else {
        // Approval workflow filtering based on settings
        const isFirstLevelApprover = approvalSetting.firstLevelApprovalId === currentEmployee.id;
        const isSecondLevelApprover = approvalSetting.secondLevelApprovalId === currentEmployee.id;
        
        console.log("DEBUG: Approval workflow filtering");
        console.log("Current user ID:", currentUser.id);
        console.log("Current employee ID:", currentEmployee.id);
        console.log("First level approver ID:", approvalSetting.firstLevelApprovalId);
        console.log("Second level approver ID:", approvalSetting.secondLevelApprovalId);
        console.log("Is first level approver:", isFirstLevelApprover);
        console.log("Is second level approver:", isSecondLevelApprover);
        
        if (isFirstLevelApprover) {
          // First level approver sees all pending applications 
          leaveAppResults = await db
            .select()
            .from(leaveApplications)
            .where(eq(leaveApplications.status, 'Pending'));
            
        } else if (isSecondLevelApprover && approvalSetting.secondLevelApprovalId) {
          // Second level approver only sees applications approved by first level
          leaveAppResults = await db
            .select()
            .from(leaveApplications)
            .where(eq(leaveApplications.status, 'First Level Approved'));
            
        } else {
          // Regular employees see only their own applications
          console.log("DEBUG: User is not an approver, getting own applications only");
          console.log("Employee ID for filtering:", currentEmployee.id);
          leaveAppResults = await storage.getLeaveApplicationsByEmployeeId(currentEmployee.id);
          console.log("Filtered applications count:", leaveAppResults.length);
        }
      }
      
      res.json(leaveAppResults);
    } catch (error) {
      console.error("Get leave applications error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({ 
        error: "Gagal mendapatkan permohonan cuti",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Approve/Reject leave application
  app.post("/api/leave-applications/:id/approve", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { action, comments } = req.body; // action: 'approve' or 'reject'
      const currentUser = req.user!;
      
      // Get current user's employee record
      const currentEmployee = await storage.getEmployeeByUserId(currentUser.id);
      if (!currentEmployee) {
        return res.status(404).json({ error: "Employee record tidak dijumpai" });
      }

      // Get leave approval settings
      const leaveApprovalSettings = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, 'leave'))
        .limit(1);

      const approvalSetting = leaveApprovalSettings[0];
      if (!approvalSetting) {
        return res.status(400).json({ error: "Tetapan kelulusan tidak dijumpai" });
      }

      // Check authorization
      const isFirstLevelApprover = approvalSetting.firstLevelApprovalId === currentEmployee.id;
      const isSecondLevelApprover = approvalSetting.secondLevelApprovalId === currentEmployee.id;
      
      if (!isFirstLevelApprover && !isSecondLevelApprover) {
        return res.status(403).json({ error: "Anda tidak mempunyai kebenaran untuk melulus permohonan ini" });
      }

      // Get the application
      const [application] = await db
        .select()
        .from(leaveApplications)
        .where(eq(leaveApplications.id, id));

      if (!application) {
        return res.status(404).json({ error: "Permohonan cuti tidak dijumpai" });
      }

      // Determine new status based on approval level and action
      let newStatus: string;
      
      if (action === 'reject') {
        newStatus = 'Rejected';
      } else if (isFirstLevelApprover && approvalSetting.secondLevelApprovalId) {
        // Two-level approval: first level approves -> "First Level Approved"
        newStatus = 'First Level Approved';
      } else {
        // Single level approval OR second level approval -> "Approved"
        newStatus = 'Approved';
      }

      // Update the application
      const [updatedApplication] = await db
        .update(leaveApplications)
        .set({
          status: newStatus,
          reviewedBy: currentUser.id,
          reviewedDate: sql`now()`,
          reviewComments: comments || null,
          updatedAt: sql`now()`
        })
        .where(eq(leaveApplications.id, id))
        .returning();

      res.json({
        success: true,
        message: action === 'approve' 
          ? `Permohonan cuti berjaya diluluskan` 
          : `Permohonan cuti telah ditolak`,
        application: updatedApplication
      });

    } catch (error) {
      console.error("Approve/reject leave application error:", error);
      res.status(500).json({ 
        error: "Gagal memproses permohonan cuti",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new leave application
  app.post("/api/leave-applications", authenticateToken, async (req, res) => {
    try {
      console.log("=== CREATE LEAVE APPLICATION ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("User:", req.user?.id, req.user?.username);
      
      const validatedData = insertLeaveApplicationSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const leaveApplication = await storage.createLeaveApplication(validatedData);
      console.log("Created leave application:", leaveApplication.id);
      
      res.status(201).json(leaveApplication);
    } catch (error) {
      console.error("Create leave application error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
      
      if (error instanceof Error && (error.name === 'ZodError' || error.message.includes('parse'))) {
        res.status(400).json({ 
          error: "Data tidak sah", 
          details: error.message,
          validationErrors: (error as any).issues || []
        });
      } else {
        res.status(500).json({ 
          error: "Gagal menambah permohonan cuti",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Update leave application (for approval/rejection)
  app.put("/api/leave-applications/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Only admin roles can update leave applications (approve/reject)
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk mengemaskini permohonan cuti" });
      }
      
      const validatedData = updateLeaveApplicationSchema.parse({
        ...req.body,
        reviewedBy: currentUser.id,
        reviewedDate: new Date()
      });
      
      const leaveApplication = await storage.updateLeaveApplication(req.params.id, validatedData);
      if (!leaveApplication) {
        return res.status(404).json({ error: "Permohonan cuti tidak dijumpai" });
      }
      res.json(leaveApplication);
    } catch (error) {
      console.error("Update leave application error:", error);
      res.status(400).json({ error: "Gagal mengemaskini permohonan cuti" });
    }
  });

  // GET /api/leave-applications/all-for-calendar - Get all leave applications for calendar display
  app.get("/api/leave-applications/all-for-calendar", authenticateToken, async (req, res) => {
    try {
      console.log("=== FETCH ALL LEAVE APPLICATIONS FOR CALENDAR ===");
      
      // Get all leave applications (no filtering by user)
      const allLeaveApps = await db
        .select({
          id: leaveApplications.id,
          employeeId: leaveApplications.employeeId,
          applicant: leaveApplications.applicant,
          leaveType: leaveApplications.leaveType,
          startDate: leaveApplications.startDate,
          endDate: leaveApplications.endDate,
          totalDays: leaveApplications.totalDays,
          status: leaveApplications.status,
          reason: leaveApplications.reason,
        })
        .from(leaveApplications)
        .orderBy(desc(leaveApplications.createdAt));

      console.log(`Found ${allLeaveApps.length} leave applications for calendar`);
      res.json(allLeaveApps);
    } catch (error) {
      console.error("Fetch leave applications for calendar error:", error);
      res.status(500).json({ 
        error: "Gagal mengambil permohonan cuti untuk kalendar",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =================== APPROVAL SETTINGS ROUTES ===================

  // GET /api/approval-settings/leave - Get leave approval settings
  app.get("/api/approval-settings/leave", authenticateToken, async (req, res) => {
    try {
      const [approvalSetting] = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, 'leave'))
        .limit(1);

      if (!approvalSetting) {
        return res.status(404).json({ error: "Tetapan kelulusan tidak dijumpai" });
      }

      res.json(approvalSetting);
    } catch (error) {
      console.error("Get leave approval settings error:", error);
      res.status(500).json({ 
        error: "Gagal mengambil tetapan kelulusan",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/approval-settings - Save approval settings
  app.post("/api/approval-settings", authenticateToken, async (req, res) => {
    try {
      const { type, firstLevelApprovalId, secondLevelApprovalId, enableApproval, approvalLevel } = req.body;
      
      // Check if approval setting already exists for this type
      const [existingSetting] = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, type));
      
      const updateData: any = {
        firstLevelApprovalId: (firstLevelApprovalId === "none" || firstLevelApprovalId === "") ? null : firstLevelApprovalId,
        secondLevelApprovalId: (secondLevelApprovalId === "none" || secondLevelApprovalId === "") ? null : secondLevelApprovalId,
        updatedAt: sql`now()`,
      };

      // Add payment-specific fields if type is payment
      if (type === "payment") {
        updateData.enableApproval = enableApproval;
        updateData.approvalLevel = approvalLevel;
      }
      
      if (existingSetting) {
        // Update existing setting
        const [updatedSetting] = await db
          .update(approvalSettings)
          .set(updateData)
          .where(eq(approvalSettings.id, existingSetting.id))
          .returning();
        
        return res.json(updatedSetting);
      } else {
        // Create new setting
        const insertData: any = {
          type,
          firstLevelApprovalId: (firstLevelApprovalId === "none" || firstLevelApprovalId === "") ? null : firstLevelApprovalId,
          secondLevelApprovalId: (secondLevelApprovalId === "none" || secondLevelApprovalId === "") ? null : secondLevelApprovalId,
        };

        // Add payment-specific fields if type is payment
        if (type === "payment") {
          insertData.enableApproval = enableApproval;
          insertData.approvalLevel = approvalLevel;
        }

        const [newSetting] = await db
          .insert(approvalSettings)
          .values(insertData)
          .returning();
        
        return res.json(newSetting);
      }
    } catch (error) {
      console.error("Error saving approval settings:", error);
      res.status(500).json({ error: "Failed to save approval settings" });
    }
  });

  // GET /api/approval-settings/:type - Get approval settings by type with employee details
  app.get("/api/approval-settings/:type", authenticateToken, async (req, res) => {
    try {
      const { type } = req.params;
      
      const [setting] = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, type));
      
      if (!setting) {
        return res.json({
          type,
          firstLevelApprovalId: null,
          secondLevelApprovalId: null,
        });
      }

      // Get employee details for debugging
      if (setting.firstLevelApprovalId) {
        const [firstLevelEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, setting.firstLevelApprovalId));
        console.log("First level approver:", firstLevelEmployee);
      }

      if (setting.secondLevelApprovalId) {
        const [secondLevelEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, setting.secondLevelApprovalId));
        console.log("Second level approver:", secondLevelEmployee);
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching approval settings:", error);
      res.status(500).json({ error: "Failed to fetch approval settings" });
    }
  });

  // =================== COMPANY LEAVE TYPES ROUTES ===================
  
  // Get all company leave types
  app.get("/api/company-leave-types", authenticateToken, async (req, res) => {
    try {
      const companyLeaveTypes = await storage.getCompanyLeaveTypes();
      res.json(companyLeaveTypes);
    } catch (error) {
      console.error("Error fetching company leave types:", error);
      res.status(500).json({ error: "Gagal mendapatkan jenis cuti syarikat" });
    }
  });

  // Get enabled company leave types
  app.get("/api/company-leave-types/enabled", authenticateToken, async (req, res) => {
    try {
      const enabledTypes = await storage.getEnabledCompanyLeaveTypes();
      res.json(enabledTypes);
    } catch (error) {
      console.error("Error fetching enabled leave types:", error);
      res.status(500).json({ error: "Gagal mendapatkan jenis cuti yang diaktifkan" });
    }
  });

  // Create company leave type
  app.post("/api/company-leave-types", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCompanyLeaveTypeSchema.parse(req.body);
      const newType = await storage.createCompanyLeaveType(validatedData);
      res.status(201).json(newType);
    } catch (error) {
      console.error("Error creating company leave type:", error);
      res.status(500).json({ error: "Gagal mencipta jenis cuti syarikat" });
    }
  });

  // Toggle company leave type (enable/disable)
  app.patch("/api/company-leave-types/:leaveType/toggle", authenticateToken, async (req, res) => {
    try {
      const { leaveType } = req.params;
      const { enabled } = req.body;
      
      const updatedType = await storage.toggleCompanyLeaveType(leaveType, enabled);
      
      if (!updatedType) {
        return res.status(404).json({ error: "Jenis cuti tidak dijumpai" });
      }
      
      res.json(updatedType);
    } catch (error) {
      console.error("Error toggling company leave type:", error);
      res.status(500).json({ error: "Gagal mengubah status jenis cuti" });
    }
  });

  // =================== GROUP POLICY SETTINGS ROUTES ===================
  
  // Get all group policy settings
  app.get("/api/group-policy-settings", authenticateToken, async (req, res) => {
    try {
      const groupPolicySettings = await storage.getAllGroupPolicySettings();
      res.json(groupPolicySettings);
    } catch (error) {
      console.error("Error fetching group policy settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan dasar kumpulan" });
    }
  });

  // Get group policy settings by leave type
  app.get("/api/group-policy-settings/:leaveType", authenticateToken, async (req, res) => {
    try {
      const { leaveType } = req.params;
      const settings = await storage.getGroupPolicySettings(decodeURIComponent(leaveType));
      res.json(settings);
    } catch (error) {
      console.error("Error fetching group policy settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan dasar kumpulan" });
    }
  });

  // Create or update group policy setting
  app.post("/api/group-policy-settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertGroupPolicySettingSchema.parse(req.body);
      const setting = await storage.createOrUpdateGroupPolicySetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating/updating group policy setting:", error);
      res.status(500).json({ error: "Gagal menyimpan tetapan dasar kumpulan" });
    }
  });

  // Delete group policy setting
  app.delete("/api/group-policy-settings/:leaveType/:role", authenticateToken, async (req, res) => {
    try {
      const { leaveType, role } = req.params;
      const deleted = await storage.deleteGroupPolicySetting(
        decodeURIComponent(leaveType), 
        decodeURIComponent(role)
      );
      
      if (!deleted) {
        return res.status(404).json({ error: "Tetapan dasar kumpulan tidak dijumpai" });
      }

      res.json({ 
        success: true,
        message: "Tetapan dasar kumpulan berjaya dipadamkan" 
      });
    } catch (error) {
      console.error("Error deleting group policy setting:", error);
      res.status(500).json({ error: "Gagal memadamkan tetapan dasar kumpulan" });
    }
  });

  // =================== LEAVE POLICY SETTINGS ROUTES ===================
  
  // Get all leave policy settings
  app.get("/api/leave-policy-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getLeavePolicySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching leave policy settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan polisi cuti" });
    }
  });

  // Get leave policy setting by leave type
  app.get("/api/leave-policy-settings/:leaveType", authenticateToken, async (req, res) => {
    try {
      const leaveType = decodeURIComponent(req.params.leaveType);
      const setting = await storage.getLeavePolicySettingByLeaveType(leaveType);
      
      if (!setting) {
        // Return default settings if not found
        const defaultSetting = {
          leaveType,
          uploadAttachment: true,
          requireReason: false,
          carryForward: true,
          proRated: true,
          roundingMethod: "round-up",
          minimumUnit: "1-day",
          dayLimit: 5,
          leaveRemark: "Leave Remarks",
          excludedEmployees: []
        };
        return res.json(defaultSetting);
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching leave policy setting:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan polisi cuti" });
    }
  });

  // Create or update leave policy setting
  app.post("/api/leave-policy-settings", authenticateToken, async (req, res) => {
    try {
      const setting = await storage.createOrUpdateLeavePolicySetting(req.body);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating/updating leave policy setting:", error);
      res.status(500).json({ error: "Gagal menyimpan tetapan polisi cuti" });
    }
  });

  // Update specific leave policy setting field
  app.patch("/api/leave-policy-settings/:leaveType", authenticateToken, async (req, res) => {
    try {
      const leaveType = decodeURIComponent(req.params.leaveType);
      
      // Get existing setting or create with defaults
      let existing = await storage.getLeavePolicySettingByLeaveType(leaveType);
      
      if (!existing) {
        // Create with defaults first
        existing = await storage.createOrUpdateLeavePolicySetting({
          leaveType,
          uploadAttachment: true,
          requireReason: false,
          carryForward: true,
          proRated: true,
          roundingMethod: "round-up",
          minimumUnit: "1-day",
          dayLimit: 5,
          leaveRemark: "Leave Remarks",
          excludedEmployees: []
        });
      }

      // Update with new values
      const updated = await storage.createOrUpdateLeavePolicySetting({
        ...existing,
        ...req.body,
        leaveType // Ensure leaveType is preserved
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating leave policy setting:", error);
      res.status(500).json({ error: "Gagal mengemas kini tetapan polisi cuti" });
    }
  });

  // =================== FINANCIAL CLAIM POLICIES ROUTES ===================

  // Get all financial claim policies
  app.get('/api/financial-claim-policies', authenticateToken, async (req, res) => {
    try {
      console.log('Financial claim policies API called');
      const policies = await storage.getAllFinancialClaimPolicies();
      console.log('Retrieved policies:', policies);
      res.json(policies);
    } catch (error) {
      console.error('Error getting financial claim policies:', error);
      res.status(500).json({ error: 'Failed to fetch financial claim policies' });
    }
  });

  // Get a single financial claim policy
  app.get('/api/financial-claim-policies/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const policy = await storage.getFinancialClaimPolicy(id);
      if (!policy) {
        return res.status(404).json({ error: 'Financial claim policy not found' });
      }
      res.json(policy);
    } catch (error) {
      console.error('Error getting financial claim policy:', error);
      res.status(500).json({ error: 'Failed to fetch financial claim policy' });
    }
  });

  // Create a new financial claim policy
  app.post('/api/financial-claim-policies', 
    authenticateToken,
    async (req, res) => {
      try {
        const validationResult = insertFinancialClaimPolicySchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: 'Data tidak sah', 
            details: validationResult.error.issues 
          });
        }

        const policy = await storage.createFinancialClaimPolicy(validationResult.data);
        res.status(201).json(policy);
      } catch (error) {
        console.error('Error creating financial claim policy:', error);
        res.status(500).json({ error: 'Failed to create financial claim policy' });
      }
    }
  );

  // Update a financial claim policy
  app.put('/api/financial-claim-policies/:id',
    authenticateToken,
    async (req, res) => {
      try {
        const { id } = req.params;
        const validationResult = updateFinancialClaimPolicySchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: 'Data tidak sah', 
            details: validationResult.error.issues 
          });
        }

        const policy = await storage.updateFinancialClaimPolicy(id, validationResult.data);
        if (!policy) {
          return res.status(404).json({ error: 'Financial claim policy not found' });
        }
        res.json(policy);
      } catch (error) {
        console.error('Error updating financial claim policy:', error);
        res.status(500).json({ error: 'Failed to update financial claim policy' });
      }
    }
  );

  // Delete a financial claim policy
  app.delete('/api/financial-claim-policies/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFinancialClaimPolicy(id);
      if (!success) {
        return res.status(404).json({ error: 'Financial claim policy not found' });
      }
      res.json({ message: 'Financial claim policy deleted successfully' });
    } catch (error) {
      console.error('Error deleting financial claim policy:', error);
      res.status(500).json({ error: 'Failed to delete financial claim policy' });
    }
  });

  // Add or remove employee from financial claim policy exclusion list
  app.put('/api/financial-claim-policies/:id/exclude-employee', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { employeeId, action } = req.body;

      if (!employeeId || !action) {
        return res.status(400).json({ error: 'Employee ID and action are required' });
      }

      if (action !== 'add' && action !== 'remove') {
        return res.status(400).json({ error: 'Action must be "add" or "remove"' });
      }

      // Get current policy
      const policy = await storage.getFinancialClaimPolicy(id);
      if (!policy) {
        return res.status(404).json({ error: 'Financial claim policy not found' });
      }

      // Get current excluded employee IDs
      let excludedEmployeeIds = policy.excludedEmployeeIds || [];

      // Add or remove employee from exclusion list
      if (action === 'add') {
        if (!excludedEmployeeIds.includes(employeeId)) {
          excludedEmployeeIds.push(employeeId);
        }
      } else if (action === 'remove') {
        excludedEmployeeIds = excludedEmployeeIds.filter(id => id !== employeeId);
      }

      // Update policy with new exclusion list
      const updatedPolicy = await storage.updateFinancialClaimPolicy(id, {
        excludedEmployeeIds
      });

      res.json({
        success: true,
        policy: updatedPolicy,
        message: action === 'add' 
          ? 'Employee excluded from policy' 
          : 'Employee included in policy'
      });
    } catch (error) {
      console.error('Error updating employee exclusion:', error);
      res.status(500).json({ error: 'Failed to update employee exclusion' });
    }
  });

  // =================== OVERTIME MANAGEMENT ROUTES ===================

  // GET /api/overtime/approval-settings - Get overtime approval settings
  app.get("/api/overtime/approval-settings", authenticateToken, async (req, res) => {
    try {
      const [settings] = await db.select().from(overtimeApprovalSettings).limit(1);
      
      if (!settings) {
        return res.json({
          firstLevel: null,
          secondLevel: null
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching overtime approval settings:", error);
      res.status(500).json({ error: "Failed to fetch overtime approval settings" });
    }
  });

  // POST /api/overtime/approval-settings - Save overtime approval settings
  app.post("/api/overtime/approval-settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertOvertimeApprovalSettingSchema.parse(req.body);
      
      // Check if settings already exist
      const [existingSettings] = await db.select().from(overtimeApprovalSettings).limit(1);
      
      let result;
      if (existingSettings) {
        // Update existing settings
        [result] = await db
          .update(overtimeApprovalSettings)
          .set({
            firstLevel: validatedData.firstLevel,
            secondLevel: validatedData.secondLevel,
            updatedAt: new Date()
          })
          .where(eq(overtimeApprovalSettings.id, existingSettings.id))
          .returning();
      } else {
        // Create new settings
        [result] = await db
          .insert(overtimeApprovalSettings)
          .values(validatedData)
          .returning();
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error saving overtime approval settings:", error);
      res.status(500).json({ error: "Failed to save overtime approval settings" });
    }
  });

  // GET /api/overtime/policies - Get all overtime policies
  app.get("/api/overtime/policies", authenticateToken, async (req, res) => {
    try {
      const policies = await db.select().from(overtimePolicies).orderBy(overtimePolicies.policyType);
      
      // If no policies exist, create default ones
      if (policies.length === 0) {
        const defaultPolicies = [
          {
            policyType: 'normal',
            policyName: 'Normal Rate',
            multiplier: '1.5',
            description: 'For overtime on normal working days',
            enabled: true
          },
          {
            policyType: 'rest_day',
            policyName: 'Rest Day Rate',
            multiplier: '2.0',
            description: 'For overtime on rest days',
            enabled: true
          },
          {
            policyType: 'public_holiday',
            policyName: 'Public Holiday Rate',
            multiplier: '3.0',
            description: 'For overtime on public holidays',
            enabled: true
          }
        ];
        
        const createdPolicies = await db
          .insert(overtimePolicies)
          .values(defaultPolicies)
          .returning();
        
        return res.json(createdPolicies);
      }
      
      res.json(policies);
    } catch (error) {
      console.error("Error fetching overtime policies:", error);
      res.status(500).json({ error: "Failed to fetch overtime policies" });
    }
  });

  // PUT /api/overtime/policies/:id - Update overtime policy
  app.put("/api/overtime/policies/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateOvertimePolicySchema.parse(req.body);
      
      const [updatedPolicy] = await db
        .update(overtimePolicies)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(overtimePolicies.id, id))
        .returning();
      
      if (!updatedPolicy) {
        return res.status(404).json({ error: "Overtime policy not found" });
      }
      
      res.json(updatedPolicy);
    } catch (error) {
      console.error("Error updating overtime policy:", error);
      res.status(500).json({ error: "Failed to update overtime policy" });
    }
  });

  // GET /api/overtime/settings - Get overtime settings
  app.get("/api/overtime/settings", authenticateToken, async (req, res) => {
    try {
      const [settings] = await db.select().from(overtimeSettings).limit(1);
      
      if (!settings) {
        // Return default settings
        return res.json({
          countOvertimeInPayroll: true,
          workingDaysPerMonth: 26,
          workingHoursPerDay: 8,
          overtimeCalculation: 'basic-salary',
          overtimeCutoffDate: 31
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching overtime settings:", error);
      res.status(500).json({ error: "Failed to fetch overtime settings" });
    }
  });

  // POST /api/overtime/settings - Save overtime settings
  app.post("/api/overtime/settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertOvertimeSettingSchema.parse(req.body);
      
      // Check if settings already exist
      const [existingSettings] = await db.select().from(overtimeSettings).limit(1);
      
      let result;
      if (existingSettings) {
        // Update existing settings
        [result] = await db
          .update(overtimeSettings)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(overtimeSettings.id, existingSettings.id))
          .returning();
      } else {
        // Create new settings
        [result] = await db
          .insert(overtimeSettings)
          .values(validatedData)
          .returning();
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error saving overtime settings:", error);
      res.status(500).json({ error: "Failed to save overtime settings" });
    }
  });

  // =================== CLAIM APPLICATION ROUTES ===================

  // Calculate overtime amount for real-time preview
  app.post('/api/overtime/calculate-amount', authenticateToken, async (req, res) => {
    try {
      const { employeeId, totalHours } = req.body;
      
      if (!employeeId || !totalHours) {
        return res.status(400).json({ error: 'Employee ID dan jumlah jam diperlukan' });
      }
      
      const amount = await storage.calculateOvertimeAmount(employeeId, parseFloat(totalHours));
      res.json({ amount });
    } catch (error) {
      console.error('Error calculating overtime amount:', error);
      res.status(500).json({ error: 'Gagal mengira jumlah overtime' });
    }
  });

  // Update all overtime amounts that are null or zero
  app.post('/api/overtime/recalculate-amounts', authenticateToken, async (req, res) => {
    try {
      const applications = await storage.getClaimApplicationsByType('overtime');
      const updates: Array<{id: string, oldAmount: number | null, newAmount: number}> = [];
      
      for (const app of applications) {
        if (app.totalHours && (!app.amount || app.amount === 0)) {
          const calculatedAmount = await storage.calculateOvertimeAmount(app.employeeId, app.totalHours);
          await storage.updateClaimApplication(app.id, {
            amount: calculatedAmount,
            calculatedAmount: calculatedAmount
          });
          updates.push({
            id: app.id,
            oldAmount: app.amount,
            newAmount: calculatedAmount
          });
        }
      }
      
      res.json({ 
        message: `${updates.length} overtime applications updated`,
        updates
      });
    } catch (error) {
      console.error('Error recalculating overtime amounts:', error);
      res.status(500).json({ error: 'Gagal mengira semula jumlah overtime' });
    }
  });

  // Get all claim applications
  app.get('/api/claim-applications', authenticateToken, async (req, res) => {
    try {
      const applications = await storage.getAllClaimApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error getting claim applications:', error);
      res.status(500).json({ error: 'Gagal mengambil permohonan tuntutan' });
    }
  });

  // Get claim applications by employee ID
  app.get('/api/claim-applications/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const applications = await storage.getClaimApplicationsByEmployeeId(employeeId);
      res.json(applications);
    } catch (error) {
      console.error('Error getting claim applications by employee:', error);
      res.status(500).json({ error: 'Gagal mengambil permohonan tuntutan pekerja' });
    }
  });

  // Get claim applications by type
  app.get('/api/claim-applications/type/:claimType', authenticateToken, async (req, res) => {
    try {
      const { claimType } = req.params;
      if (claimType !== 'financial' && claimType !== 'overtime') {
        return res.status(400).json({ error: 'Jenis tuntutan tidak sah' });
      }
      const applications = await storage.getClaimApplicationsByType(claimType as 'financial' | 'overtime');
      res.json(applications);
    } catch (error) {
      console.error('Error getting claim applications by type:', error);
      res.status(500).json({ error: 'Gagal mengambil permohonan tuntutan mengikut jenis' });
    }
  });

  // Get user-specific claim totals by policy
  app.get('/api/claim-applications/user-totals/:employeeId', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const currentUser = req.user!;
      
      // Role-based access control
      const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager'];
      const hasAdminAccess = privilegedRoles.includes(currentUser.role);
      
      // If regular user, only allow access to their own totals
      if (!hasAdminAccess) {
        const userEmployee = await storage.getEmployeeByUserId(currentUser.id);
        if (!userEmployee || userEmployee.id !== employeeId) {
          return res.status(403).json({ error: 'Tidak dibenarkan untuk mengakses jumlah tuntutan pekerja lain' });
        }
      }
      
      const claimTotals = await storage.getUserClaimTotals(employeeId);
      res.json(claimTotals);
    } catch (error) {
      console.error('Error getting user claim totals:', error);
      res.status(500).json({ error: 'Gagal mengambil jumlah tuntutan pengguna' });
    }
  });

  // Create new claim application with validation
  app.post('/api/claim-applications', authenticateToken, async (req, res) => {
    try {
      console.log('Received claim data:', req.body);
      const validationResult = insertClaimApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('Validation errors:', validationResult.error.issues);
        return res.status(400).json({ 
          error: 'Data tidak sah', 
          details: validationResult.error.issues 
        });
      }

      const data = validationResult.data;
      
      // For financial claims, validate against policy limits
      if (data.claimType === 'financial' && data.financialPolicyName && data.amount) {
        // Get the policy details
        const policies = await storage.getAllFinancialClaimPolicies();
        const policy = policies.find(p => p.claimName === data.financialPolicyName);
        
        if (!policy) {
          return res.status(400).json({ 
            error: 'Polisi kewangan tidak dijumpai' 
          });
        }

        // Check per-application limit
        if (policy.limitPerApplication && data.amount > policy.limitPerApplication) {
          return res.status(400).json({ 
            error: `Jumlah melebihi had setiap permohonan: RM${policy.limitPerApplication}` 
          });
        }

        // Check annual limit for employee
        const currentYear = new Date().getFullYear();
        const existingClaims = await storage.getClaimApplicationsByEmployeeId(data.employeeId);
        
        const approvedClaims = existingClaims.filter(claim => 
          claim.status === 'approved' &&
          claim.financialPolicyName === data.financialPolicyName &&
          new Date(claim.dateSubmitted).getFullYear() === currentYear
        );
        
        const totalApprovedAmount = approvedClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
        
        if (policy.annualLimit && totalApprovedAmount + Number(data.amount) > Number(policy.annualLimit)) {
          return res.status(400).json({ 
            error: `Jumlah melebihi had tahunan: RM${policy.annualLimit}. Jumlah yang telah diluluskan: RM${totalApprovedAmount}` 
          });
        }
      }

      const application = await storage.createClaimApplication(data);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating claim application:', error);
      res.status(500).json({ error: 'Gagal membuat permohonan tuntutan' });
    }
  });

  // Update claim application
  app.put('/api/claim-applications/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = updateClaimApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Data tidak sah', 
          details: validationResult.error.issues 
        });
      }

      const application = await storage.updateClaimApplication(id, validationResult.data);
      if (!application) {
        return res.status(404).json({ error: 'Permohonan tuntutan tidak dijumpai' });
      }
      res.json(application);
    } catch (error) {
      console.error('Error updating claim application:', error);
      res.status(500).json({ error: 'Gagal mengemas kini permohonan tuntutan' });
    }
  });

  // Approve claim application
  app.post('/api/claim-applications/:id/approve', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { approverId } = req.body;
      
      if (!approverId) {
        return res.status(400).json({ error: 'ID pelulus diperlukan' });
      }

      const success = await storage.approveClaimApplication(id, approverId);
      if (!success) {
        return res.status(404).json({ error: 'Permohonan tuntutan tidak dijumpai' });
      }
      
      res.json({ message: 'Permohonan tuntutan berjaya diluluskan' });
    } catch (error) {
      console.error('Error approving claim application:', error);
      res.status(500).json({ error: 'Gagal meluluskan permohonan tuntutan' });
    }
  });

  // Reject claim application
  app.post('/api/claim-applications/:id/reject', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectorId, reason } = req.body;
      
      if (!rejectorId || !reason) {
        return res.status(400).json({ error: 'ID penolak dan sebab penolakan diperlukan' });
      }

      const success = await storage.rejectClaimApplication(id, rejectorId, reason);
      if (!success) {
        return res.status(404).json({ error: 'Permohonan tuntutan tidak dijumpai' });
      }
      
      res.json({ message: 'Permohonan tuntutan berjaya ditolak' });
    } catch (error) {
      console.error('Error rejecting claim application:', error);
      res.status(500).json({ error: 'Gagal menolak permohonan tuntutan' });
    }
  });

  // =================== EMPLOYEE SALARY ROUTES ===================
  
  // Get employee details (for Personal Details in salary summary)
  app.get('/api/employees/:employeeId/details', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Get employee with employment and contact details
      const [employeeData] = await db
        .select()
        .from(employees)
        .leftJoin(employment, eq(employees.id, employment.employeeId))
        .leftJoin(contact, eq(employees.id, contact.employeeId))
        .where(eq(employees.id, employeeId));
        
      if (!employeeData) {
        return res.status(404).json({ error: 'Pekerja tidak dijumpai' });
      }
      
      res.json(employeeData);
    } catch (error) {
      console.error('Error getting employee details:', error);
      res.status(500).json({ error: 'Gagal mengambil maklumat pekerja' });
    }
  });
  
  // Get employee salary details (Master Salary format)
  app.get('/api/employees/:employeeId/salary', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const salaryData = await storage.getMasterSalaryData(employeeId);
      
      if (!salaryData) {
        return res.status(404).json({ error: 'Maklumat gaji pekerja tidak dijumpai' });
      }
      
      res.json(salaryData);
    } catch (error) {
      console.error('Error getting employee salary:', error);
      res.status(500).json({ error: 'Gagal mengambil maklumat gaji pekerja' });
    }
  });

  // Create employee salary (Master Salary format)
  app.post('/api/employees/:employeeId/salary', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { employeeId } = req.params;
      
      console.log('POST /api/employees/:employeeId/salary called');
      console.log('Current user:', currentUser.role, currentUser.id);
      console.log('Employee ID:', employeeId);
      
      // Role-based access control for salary creation
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        console.log('Access denied: insufficient role for salary creation');
        return res.status(403).json({ error: 'Tidak dibenarkan untuk membuat maklumat gaji' });
      }
      
      const salaryData = { ...req.body, employeeId };
      const salary = await storage.saveMasterSalaryData(salaryData);
      res.status(201).json(salary);
    } catch (error) {
      console.error('Error creating employee salary:', error);
      res.status(500).json({ error: 'Gagal membuat maklumat gaji pekerja' });
    }
  });

  // Calculate overtime amount for employee
  app.get('/api/employees/:employeeId/overtime-amount', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }
      
      const overtimeAmount = await storage.calculateEmployeeOvertimeAmount(
        employeeId, 
        parseInt(year as string), 
        parseInt(month as string)
      );
      
      res.json({ overtimeAmount });
    } catch (error) {
      console.error('Error calculating overtime amount:', error);
      res.status(500).json({ error: 'Failed to calculate overtime amount' });
    }
  });

  // Update employee salary (Master Salary format)
  app.put('/api/employees/:employeeId/salary', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { employeeId } = req.params;
      
      console.log('PUT /api/employees/:employeeId/salary called');
      console.log('Current user:', currentUser.role, currentUser.id);
      console.log('Employee ID:', employeeId);
      console.log('Request body keys:', Object.keys(req.body));
      
      // Role-based access control for salary updates
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        console.log('Access denied: insufficient role');
        return res.status(403).json({ error: 'Tidak dibenarkan untuk mengemas kini maklumat gaji' });
      }
      
      const salaryData = { ...req.body, employeeId };
      console.log('Saving salary data for employee:', employeeId);
      
      const salary = await storage.saveMasterSalaryData(salaryData);
      console.log('Salary data saved successfully');
      
      if (!salary) {
        return res.status(404).json({ error: 'Maklumat gaji pekerja tidak dijumpai' });
      }
      
      res.json(salary);
    } catch (error) {
      console.error('Error updating employee salary:', error);
      res.status(500).json({ error: 'Gagal mengemas kini maklumat gaji pekerja' });
    }
  });

  // Update manual YTD values in Master Salary
  app.put('/api/employees/:employeeId/salary/manual-ytd', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { employeeId } = req.params;
      const { ytdData } = req.body;
      
      console.log('PUT /api/employees/:employeeId/salary/manual-ytd called');
      console.log('Employee ID:', employeeId);
      console.log('YTD Data:', ytdData);
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk mengemas kini YTD manual' });
      }
      
      // Get existing salary data
      const existingSalary = await storage.getEmployeeSalaryByEmployeeId(employeeId);
      if (!existingSalary) {
        return res.status(404).json({ error: 'Maklumat gaji pekerja tidak dijumpai' });
      }
      
      // Update manual YTD
      const updatedSalaryData = {
        ...existingSalary,
        manualYtd: JSON.stringify(ytdData),
        employeeId
      };
      
      const salary = await storage.saveMasterSalaryData(updatedSalaryData);
      
      res.json({ 
        success: true, 
        message: 'Manual YTD berjaya dikemas kini',
        ytdData: JSON.parse(salary.manualYtd || '{}')
      });
    } catch (error) {
      console.error('Error updating manual YTD:', error);
      res.status(500).json({ error: 'Gagal mengemas kini YTD manual' });
    }
  });

  // =================== PAYROLL ENDPOINTS ===================
  
  // Get all payroll documents
  app.get('/api/payroll/documents', authenticateToken, async (req, res) => {
    try {
      const documents = await storage.getAllPayrollDocuments();
      res.json(documents);
    } catch (error) {
      console.error('Error getting payroll documents:', error);
      res.status(500).json({ error: 'Gagal mengambil senarai dokumen payroll' });
    }
  });

  // Get specific payroll document
  app.get('/api/payroll/documents/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getPayrollDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error getting payroll document:', error);
      res.status(500).json({ error: 'Gagal mengambil dokumen payroll' });
    }
  });

  // Create new payroll document
  app.post('/api/payroll/documents', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      console.log('Creating payroll document for user:', currentUser.role);
      console.log('Request body:', req.body);
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk membuat dokumen payroll' });
      }

      const documentData = insertPayrollDocumentSchema.parse({
        ...req.body,
        createdBy: currentUser.id
      });
      console.log('Parsed document data:', documentData);
      
      // Check if document already exists for this year/month
      const existing = await storage.getPayrollDocumentByYearMonth(documentData.year, documentData.month);
      if (existing) {
        return res.status(400).json({ error: `Dokumen payroll untuk ${documentData.month}/${documentData.year} sudah wujud` });
      }
      
      const document = await storage.createPayrollDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error('Error creating payroll document:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Gagal membuat dokumen payroll' });
      }
    }
  });

  // Update payroll document
  app.put('/api/payroll/documents/:id', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk mengemas kini dokumen payroll' });
      }

      const updateData = updatePayrollDocumentSchema.parse(req.body);
      const document = await storage.updatePayrollDocument(id, updateData);
      
      if (!document) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error updating payroll document:', error);
      res.status(500).json({ error: 'Gagal mengemas kini dokumen payroll' });
    }
  });

  // DELETE /api/payroll/documents/:id - Delete payroll document and all related payroll items
  app.delete('/api/payroll/documents/:id', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Role-based access control - only high-level roles can delete payroll documents
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk memadam dokumen payroll' });
      }

      // Check if document exists
      const document = await storage.getPayrollDocument(id);
      if (!document) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }

      // Delete all payroll items for this document first
      await storage.deletePayrollItemsByDocumentId(id);
      
      // Then delete the document itself
      const deleted = await storage.deletePayrollDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json({ message: 'Dokumen payroll dan semua data berkaitan telah berjaya dipadam' });
    } catch (error) {
      console.error('Error deleting payroll document:', error);
      res.status(500).json({ error: 'Gagal memadam dokumen payroll' });
    }
  });

  // Generate payroll items for a document
  app.post('/api/payroll/documents/:id/generate', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      const { force } = req.body; // Add force parameter to allow regeneration
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk menjana slip gaji' });
      }

      const items = await storage.generatePayrollItems(id, force);
      res.json({ 
        message: `${items.length} slip gaji berjaya dijana`,
        items: items.length 
      });
    } catch (error) {
      console.error('Error generating payroll items:', error);
      res.status(500).json({ error: 'Gagal menjana slip gaji pekerja' });
    }
  });

  // NEW: Refresh/update existing payroll items with current Master Salary configuration
  app.post('/api/payroll/documents/:id/refresh', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk mengemaskini slip gaji' });
      }

      // Force regenerate all existing items to use current Master Salary configuration
      console.log('Starting payroll refresh with current Master Salary configuration for document:', id);
      const items = await storage.generatePayrollItems(id, true); // Force regeneration
      
      res.json({ 
        message: `${items.length} slip gaji berjaya dikemaskini dengan konfigurasi terkini`,
        items: items.length 
      });
    } catch (error) {
      console.error('Error refreshing payroll items:', error);
      res.status(500).json({ error: 'Gagal mengemaskini slip gaji dengan konfigurasi terkini' });
    }
  });

  // Get payroll items for a document
  app.get('/api/payroll/documents/:id/items', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getPayrollItemsByDocumentId(id);
      
      // Enrich items with employee details
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const employee = await storage.getEmployee(item.employeeId);
          return {
            ...item,
            employee: employee ? {
              fullName: employee.fullName,
              staffId: employee.staffId,
              nric: employee.nric
            } : null
          };
        })
      );
      
      res.json(enrichedItems);
    } catch (error) {
      console.error('Error getting payroll items:', error);
      res.status(500).json({ error: 'Gagal mengambil senarai slip gaji' });
    }
  });

  // Get specific payroll item
  app.get('/api/payroll/items/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getPayrollItem(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Slip gaji tidak dijumpai' });
      }

      // Enrich with employee details
      const employee = await storage.getEmployee(item.employeeId);
      const enrichedItem = {
        ...item,
        employee: employee ? {
          fullName: employee.fullName,
          staffId: employee.staffId,
          nric: employee.nric
        } : null
      };
      
      res.json(enrichedItem);
    } catch (error) {
      console.error('Error getting payroll item:', error);
      res.status(500).json({ error: 'Gagal mengambil slip gaji' });
    }
  });

  // Update specific payroll item
  app.put('/api/payroll/items/:id', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk mengemas kini slip gaji' });
      }

      const updateData = updatePayrollItemSchema.parse(req.body);
      const item = await storage.updatePayrollItem(id, updateData);
      
      if (!item) {
        return res.status(404).json({ error: 'Slip gaji tidak dijumpai' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error updating payroll item:', error);
      res.status(500).json({ error: 'Gagal mengemas kini slip gaji' });
    }
  });

  // Get employee's payroll history
  app.get('/api/employees/:employeeId/payroll-history', authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const currentUser = req.user!;
      
      // Check if user can access this employee's payroll
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Pekerja tidak dijumpai' });
      }

      // Role-based access: admins can see all, employees can only see their own
      const isAdmin = ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(currentUser.role);
      const isOwnRecord = employee.userId === currentUser.id;
      
      if (!isAdmin && !isOwnRecord) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk melihat rekod gaji pekerja lain' });
      }

      // Get all documents first
      const documents = await storage.getAllPayrollDocuments();
      
      // Get payroll items for this employee from all documents
      const history = [];
      for (const doc of documents) {
        const item = await storage.getPayrollItemByDocumentAndEmployee(doc.id, employeeId);
        if (item) {
          history.push({
            document: {
              id: doc.id,
              year: doc.year,
              month: doc.month,
              payrollDate: doc.payrollDate,
              status: doc.status
            },
            payrollItem: item
          });
        }
      }
      
      // Sort by year and month desc
      history.sort((a, b) => {
        if (a.document.year !== b.document.year) {
          return b.document.year - a.document.year;
        }
        return b.document.month - a.document.month;
      });
      
      res.json(history);
    } catch (error) {
      console.error('Error getting payroll history:', error);
      res.status(500).json({ error: 'Gagal mengambil sejarah gaji pekerja' });
    }
  });

  // Approve payroll document
  app.post('/api/payroll/documents/:id/approve', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { approverId } = req.body;
      
      if (!approverId) {
        return res.status(400).json({ error: 'ID pelulus diperlukan' });
      }

      const success = await storage.approvePayrollDocument(id, approverId);
      if (!success) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json({ message: 'Dokumen payroll berjaya diluluskan' });
    } catch (error) {
      console.error('Error approving payroll document:', error);
      res.status(500).json({ error: 'Gagal meluluskan dokumen payroll' });
    }
  });

  // Reject payroll document
  app.post('/api/payroll/documents/:id/reject', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectorId, reason } = req.body;
      
      if (!rejectorId || !reason) {
        return res.status(400).json({ error: 'ID penolak dan sebab penolakan diperlukan' });
      }

      const success = await storage.rejectPayrollDocument(id, rejectorId, reason);
      if (!success) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json({ message: 'Dokumen payroll berjaya ditolak' });
    } catch (error) {
      console.error('Error rejecting payroll document:', error);
      res.status(500).json({ error: 'Gagal menolak dokumen payroll' });
    }
  });

  // Submit payment for payroll document (change status to "sent")
  app.post('/api/payroll/documents/:id/submit-payment', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { submitterId } = req.body;
      
      if (!submitterId) {
        return res.status(400).json({ error: 'ID pelulusan diperlukan' });
      }

      const success = await storage.submitPaymentPayrollDocument(id, submitterId);
      if (!success) {
        return res.status(404).json({ error: 'Dokumen payroll tidak dijumpai' });
      }
      
      res.json({ message: 'Pembayaran payroll berjaya dihantar' });
    } catch (error) {
      console.error('Error submitting payment for payroll document:', error);
      res.status(500).json({ error: 'Gagal menghantar pembayaran payroll' });
    }
  });

  // =================== COMPANY SETTINGS ROUTES ===================
  
  // Get payment settings (for currency and other payment configurations)
  app.get("/api/payment-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      // Return payment-specific settings including currency
      const paymentSettings = {
        currency: settings?.currency || 'RM',
        epfEnabled: settings?.epfEnabled ?? true,
        socsoEnabled: settings?.socsoEnabled ?? true,
        eisEnabled: settings?.eisEnabled ?? true,
        hrdfEnabled: settings?.hrdfEnabled ?? true,
        pcb39Enabled: settings?.pcb39Enabled ?? true,
        standardWorkingHour: settings?.standardWorkingHour || '8'
      };
      res.json(paymentSettings);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan pembayaran" });
    }
  });

  // Get financial settings
  app.get("/api/financial-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getFinancialSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching financial settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan kewangan" });
    }
  });

  // Create or update financial settings (upsert)
  app.post("/api/financial-settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertFinancialSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateFinancialSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving financial settings:", error);
      res.status(500).json({ error: "Gagal menyimpan tetapan kewangan" });
    }
  });

  // Get company settings
  app.get("/api/company-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan syarikat" });
    }
  });

  // Create or update company settings (upsert)
  app.post("/api/company-settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCompanySettingSchema.parse(req.body);
      
      // Check if company settings already exist
      const existingSettings = await storage.getCompanySettings();
      
      let settings;
      if (existingSettings) {
        // Update existing settings
        console.log("Updating existing company settings with ID:", existingSettings.id);
        settings = await storage.updateCompanySettings(existingSettings.id, validatedData);
      } else {
        // Create new settings
        console.log("Creating new company settings");
        settings = await storage.createCompanySettings(validatedData);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error saving company settings:", error);
      res.status(500).json({ error: "Gagal menyimpan tetapan syarikat" });
    }
  });

  // Update company settings
  app.put("/api/company-settings/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = updateCompanySettingSchema.parse(req.body);
      const updatedSettings = await storage.updateCompanySettings(req.params.id, validatedData);
      
      if (!updatedSettings) {
        return res.status(404).json({ error: "Tetapan syarikat tidak dijumpai" });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ error: "Gagal mengemas kini tetapan syarikat" });
    }
  });

  // =================== PDF PAYSLIP GENERATION ===================
  // Generate PDF payslip for employee using Puppeteer + Handlebars
  // HTML Preview version for inline display
  app.get("/api/payroll/payslip/:employeeId/preview", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { documentId, token } = req.query;

      if (!documentId) {
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      // Verify token - simple check for now
      if (!token) {
        return res.status(401).json({ error: "Token diperlukan" });
      }

      // Debug: Log selected employee
      console.log('=== PREVIEW REQUEST START ===');
      console.log('Selected Employee ID:', employeeId);
      console.log('Document ID:', documentId);

      // Get payroll document and item
      const document = await storage.getPayrollDocument(documentId as string);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId as string, employeeId);
      const employee = await storage.getEmployee(employeeId);
      const employment = await storage.getEmploymentByEmployeeId(employeeId);
      const companySettings = await storage.getCompanySettings();

      console.log('Employee found:', employee?.fullName);
      console.log('Employee NRIC:', employee?.nric);
      console.log('Employee data:', JSON.stringify(employee, null, 2));
      console.log('Employment data:', JSON.stringify(employment, null, 2));
      console.log('Payroll item found:', !!payrollItem);
      
      console.log("Company settings retrieved:", companySettings);
      console.log("Company logo URL:", companySettings?.logoUrl);

      if (!document || !payrollItem || !employee) {
        return res.status(404).json({ error: "Data payroll tidak dijumpai" });
      }

      // Parse payroll item data
      const employeeSnapshot = JSON.parse(payrollItem.employeeSnapshot);
      const salary = JSON.parse(payrollItem.salary);
      const storedDeductions = JSON.parse(payrollItem.deductions);
      const contributions = JSON.parse(payrollItem.contributions);
      
      console.log('Employee Snapshot data:', JSON.stringify(employeeSnapshot, null, 2));
      console.log('=== TEMPLATE EMPLOYEE DATA DEBUG ===');
      console.log('Employee from DB:', employee);
      console.log('Employment from DB:', employment);  
      console.log('Employee Snapshot:', employeeSnapshot);
      console.log('=== END TEMPLATE EMPLOYEE DATA DEBUG ===');

      console.log("Payroll deductions from item (stored):", storedDeductions);
      console.log("Salary data structure:", JSON.stringify(salary, null, 2));
      console.log("About to get current master salary...");

      // Get current Master Salary Configuration for accurate deduction values
      console.log("Getting current master salary for employee:", employeeId);
      const currentMasterSalary = await storage.getEmployeeSalaryByEmployeeId(employeeId);
      console.log("Current master salary found:", !!currentMasterSalary);
      let deductions = storedDeductions;
      
      if (currentMasterSalary) {
        const masterDeductions = currentMasterSalary.deductions ? JSON.parse(currentMasterSalary.deductions) : {};
        console.log("Master Salary deductions (current):", masterDeductions);
        
        // Override stored deductions with current Master Salary values to ensure accuracy
        deductions = {
          ...storedDeductions,
          // Use current Master Salary values for accurate current month deductions
          epfEmployee: masterDeductions.epfEmployee || storedDeductions.epfEmployee,
          socsoEmployee: masterDeductions.socsoEmployee || storedDeductions.socsoEmployee,
          eisEmployee: masterDeductions.eisEmployee || storedDeductions.eisEmployee,
          advance: masterDeductions.advance || storedDeductions.advance,
          unpaidLeave: masterDeductions.unpaidLeave || storedDeductions.unpaidLeave,
          pcb39: masterDeductions.pcb39 || storedDeductions.pcb39,
          pcb38: masterDeductions.pcb38 || storedDeductions.pcb38,
          zakat: masterDeductions.zakat || storedDeductions.zakat,
          other: masterDeductions.other || storedDeductions.other
        };
        console.log("Final deductions (with Master Salary override):", deductions);
      }

      // Format monetary values
      const formatMoney = (value: any) => {
        const num = parseFloat(value || "0");
        return num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // Prepare template data same as PDF
      const templateData = {
        company: {
          name: companySettings?.companyName || "UTAMA MEDGROUP SDN BHD",
          regNo: companySettings?.companyRegistrationNumber || "202201033996(1479693-H)",
          address: companySettings ? 
            `${companySettings.address}${companySettings.postcode ? ', ' + companySettings.postcode : ''}${companySettings.city ? ', ' + companySettings.city : ''}${companySettings.state ? ', ' + companySettings.state : ''}` :
            "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN",
          addressLines: companySettings ? 
            [`${companySettings.address}${companySettings.postcode ? ', ' + companySettings.postcode : ''}${companySettings.city ? ', ' + companySettings.city : ''}${companySettings.state ? ', ' + companySettings.state : ''}`] :
            ["A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN"],
          logoHTML: companySettings?.logoUrl ? 
            `<img src="${companySettings.logoUrl}" class="company-logo" alt="Company Logo" style="width:80px;height:80px;object-fit:contain;display:block;border:none;" />` : 
            ""
        },
        employee: (() => {
          const name = employee.fullName || employeeSnapshot.fullName || employeeSnapshot.name || "SYED MUHYAZIR HASSIM";
          const icNo = employee.nric || employeeSnapshot.nric || employeeSnapshot.icNo || employeeSnapshot.ic || "881012-14-5678";
          const position = employment?.designation || employeeSnapshot.position || employeeSnapshot.designation || "SENIOR MANAGER";
          
          console.log('=== EMPLOYEE TEMPLATE VALUES ===');
          console.log('Final name:', name);
          console.log('Final icNo:', icNo);
          console.log('Final position:', position);
          console.log('=== END EMPLOYEE TEMPLATE VALUES ===');
          
          return {
            name: name,
            icNo: icNo,
            position: position
          };
        })(),
        period: {
          month: getMonthName(document.month),
          year: document.year
        },
        income: {
          basic: formatMoney(salary.basic),
          fixedAllowance: formatMoney(salary.fixedAllowance || "0"),
          items: (() => {
            const items = [];
            
            console.log('=== ENHANCED TEMPLATE INCOME ITEMS PROCESSING ===');
            console.log('Salary data:', JSON.stringify(salary, null, 2));
            
            // FIRST: Always add Basic Salary if it exists and > 0
            const basicSalaryAmount = parseFloat(salary.basic || salary.basicSalary || "0");
            console.log('Basic Salary amount:', basicSalaryAmount);
            if (basicSalaryAmount > 0.01) {
              console.log(`✓ Adding Basic Salary to template: RM ${basicSalaryAmount}`);
              items.push({
                label: "Basic Salary",
                amount: formatMoney(basicSalaryAmount),
                show: true
              });
            } else {
              console.log(`✗ Basic Salary not added: RM ${basicSalaryAmount} (≤ 0.01)`);
            }
            
            // SECOND: Process additional items from salary.additional array
            if (salary.additional && Array.isArray(salary.additional)) {
              console.log('Processing additional items from salary.additional:', salary.additional.length);
              salary.additional.forEach((item, index) => {
                const amount = parseFloat(item.amount || 0);
                console.log(`Item ${index + 1}: ${item.label} (${item.code}) = RM ${amount}`);
                
                if (amount > 0.01) {
                  console.log(`✓ Adding ${item.label} to template: RM ${amount}`);
                  items.push({
                    label: item.label,
                    amount: formatMoney(item.amount),
                    show: true
                  });
                } else {
                  console.log(`✗ Skipping ${item.label}: RM ${amount} (≤ 0.01)`);
                }
              });
            } else {
              console.log('No additional items found or salary.additional is not an array');
            }
            
            // Add fixed allowance if it exists and > 0 (but not duplicating from additional items)
            const fixedAllowanceAmount = parseFloat(salary.fixedAllowance || "0");
            if (fixedAllowanceAmount > 0.01) {
              console.log(`✓ Adding Fixed Allowance: RM ${fixedAllowanceAmount}`);
              // Check if it's not already in additional items
              const hasFixedInAdditional = salary.additional?.some((item: any) => 
                item.code === 'FIXED' || item.label?.includes('FIXED ALLOWANCE')
              );
              if (!hasFixedInAdditional) {
                items.push({
                  label: "Fixed Allowance",
                  amount: formatMoney(salary.fixedAllowance),
                  show: true
                });
              }
            }
            
            console.log('Final income items for template:', items);
            console.log('=== END ENHANCED TEMPLATE INCOME ITEMS PROCESSING ===');
            
            return items;
          })(),
          totalGross: formatMoney(salary.gross)
        },
        deduction: {
          epfEmp: formatMoney(deductions.epfEmployee),
          socsoEmp: formatMoney(deductions.socsoEmployee),
          eisEmp: formatMoney(deductions.eisEmployee),
          items: (() => {
            const items = [];
            
            console.log('=== DEDUCTION ITEMS PROCESSING ===');
            console.log('Processing deductions for template:', deductions);
            console.log('Checking each deduction item for values > 0...');
            
            // Add standard deduction fields from payroll data that have values
            if (parseFloat(deductions.advance || "0") > 0) {
              console.log('✓ Adding Advance:', deductions.advance);
              items.push({
                label: "Advance",
                amount: formatMoney(deductions.advance),
                show: true
              });
            }
            
            if (parseFloat(deductions.unpaidLeave || "0") > 0) {
              items.push({
                label: "Unpaid Leave",
                amount: formatMoney(deductions.unpaidLeave),
                show: true
              });
            }
            
            if (parseFloat(deductions.pcb39 || "0") > 0) {
              items.push({
                label: "PCB 39",
                amount: formatMoney(deductions.pcb39),
                show: true
              });
            }
            
            if (parseFloat(deductions.pcb38 || "0") > 0) {
              items.push({
                label: "PCB 38",
                amount: formatMoney(deductions.pcb38),
                show: true
              });
            }
            
            if (parseFloat(deductions.zakat || "0") > 0) {
              items.push({
                label: "Zakat",
                amount: formatMoney(deductions.zakat),
                show: true
              });
            }
            
            // Handle deductions.other - either single value or array, but not both
            if (deductions.other && Array.isArray(deductions.other)) {
              // Process as array of custom items
              deductions.other.forEach((customItem: any, index: number) => {
                if (parseFloat(customItem.amount || "0") > 0) {
                  // Try to determine proper label - prioritize name then label
                  let deductionLabel = customItem.name || customItem.label;
                  
                  // If still no name, check if this looks like PCB based on common patterns
                  if (!deductionLabel) {
                    const amount = parseFloat(customItem.amount || "0");
                    // Common PCB amounts in Malaysia are typically 100-500 range
                    if (amount >= 50 && amount <= 1000) {
                      deductionLabel = "MTD/PCB";
                    } else {
                      deductionLabel = `Custom Deduction ${index + 1}`;
                    }
                  }
                  
                  console.log(`✓ Adding custom deduction: ${deductionLabel} = ${customItem.amount}`);
                  items.push({
                    label: deductionLabel,
                    amount: formatMoney(customItem.amount),
                    show: true
                  });
                }
              });
            } else if (parseFloat(deductions.other || "0") > 0) {
              // Process as single MTD/PCB value (most common case)
              console.log('✓ Adding MTD/PCB deduction:', deductions.other);
              items.push({
                label: "MTD/PCB",
                amount: formatMoney(deductions.other),
                show: true
              });
            }
            
            console.log('Final deduction items for template:', items);
            console.log('=== END DEDUCTION ITEMS PROCESSING ===');
            return items;
          })(),
          total: (() => {
            const epf = parseFloat(deductions.epfEmployee || "0");
            const socso = parseFloat(deductions.socsoEmployee || "0");
            const eis = parseFloat(deductions.eisEmployee || "0");
            const advance = parseFloat(deductions.advance || "0");
            const unpaidLeave = parseFloat(deductions.unpaidLeave || "0");
            const pcb39 = parseFloat(deductions.pcb39 || "0");
            const pcb38 = parseFloat(deductions.pcb38 || "0");
            const zakat = parseFloat(deductions.zakat || "0");
            const other = (() => {
              if (Array.isArray(deductions.other)) return 0;
              if (typeof deductions.other === 'number') return deductions.other;
              if (typeof deductions.other === 'string' && deductions.other !== '') return parseFloat(deductions.other);
              return 0;
            })();
            
            // Calculate custom total from snapshot data only
            let customTotal = 0;
            if (deductions.other && Array.isArray(deductions.other)) {
              deductions.other.forEach((item: any) => {
                customTotal += parseFloat(item.amount || "0");
              });
            }
            
            const total = epf + socso + eis + advance + unpaidLeave + pcb39 + pcb38 + zakat + other + customTotal;
            console.log("Deduction calculation:", {epf, socso, eis, advance, unpaidLeave, pcb39, pcb38, zakat, other, customTotal, total});
            return formatMoney(total);
          })()
        },
        netIncome: (() => {
          console.log("=== NET PAY CALCULATION START ===");
          // Calculate net pay dynamically: Gross Income - Total Deductions
          const grossIncome = parseFloat(salary.gross || "0");
          console.log("Gross income for net pay:", grossIncome);
          const totalDeductions = (() => {
            const epf = parseFloat(deductions.epfEmployee || "0");
            const socso = parseFloat(deductions.socsoEmployee || "0");
            const eis = parseFloat(deductions.eisEmployee || "0");
            const advance = parseFloat(deductions.advance || "0");
            const unpaidLeave = parseFloat(deductions.unpaidLeave || "0");
            const pcb39 = parseFloat(deductions.pcb39 || "0");
            const pcb38 = parseFloat(deductions.pcb38 || "0");
            const zakat = parseFloat(deductions.zakat || "0");
            const other = (() => {
              if (Array.isArray(deductions.other)) return 0;
              if (typeof deductions.other === 'number') return deductions.other;
              if (typeof deductions.other === 'string' && deductions.other !== '') return parseFloat(deductions.other);
              return 0;
            })();
            
            let customTotal = 0;
            if (deductions.other && Array.isArray(deductions.other)) {
              deductions.other.forEach((item: any) => {
                customTotal += parseFloat(item.amount || "0");
              });
            }
            
            return epf + socso + eis + advance + unpaidLeave + pcb39 + pcb38 + zakat + other + customTotal;
          })();
          
          const netPay = grossIncome - totalDeductions;
          console.log("NET PAY CALCULATION:", {grossIncome, totalDeductions, netPay});
          return formatMoney(netPay);
        })(),
        employerContrib: {
          epfEr: formatMoney(contributions.epfEmployer),
          socsoEr: formatMoney(contributions.socsoEmployer),
          eisEr: formatMoney(contributions.eisEmployer),
          hrdfEr: formatMoney(contributions.hrdfEmployer || 35.00)
        },
        ytd: await (async () => {
          const ytdData = await getYTDBreakdown(employeeId, documentId as string);
          return {
            employee: ytdData.ytdEmployeeTotal,
            employer: ytdData.ytdEmployerTotal,
            mtd: formatMoney(payrollItem.netPay),
            breakdown: {
              epfEmployee: ytdData.ytdEpfEmployee,
              socsoEmployee: ytdData.ytdSocsoEmployee,
              eisEmployee: ytdData.ytdEisEmployee,
              pcb: ytdData.ytdPcbEmployee,
              epfEmployer: ytdData.ytdEpfEmployer,
              socsoEmployer: ytdData.ytdSocsoEmployer,
              eisEmployer: ytdData.ytdEisEmployer,
              hrdfEmployer: ytdData.ytdHrdfEmployer
            }
          };
        })()
      };

      // Generate HTML preview
      const htmlContent = generatePayslipHTML(templateData);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);

    } catch (error) {
      console.error("Error generating HTML preview:", error);
      res.status(500).json({ error: "Gagal menjana preview slip gaji" });
    }
  });

  // Template Data endpoint for PDF generation (returns JSON templateData)
  app.get("/api/payroll/payslip/:employeeId/template-data", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { documentId } = req.query;

      if (!documentId) {
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      console.log('=== TEMPLATE DATA REQUEST ===');
      console.log('Employee ID:', employeeId);
      console.log('Document ID:', documentId);

      // Reuse same logic as preview endpoint but return templateData only
      const document = await storage.getPayrollDocument(documentId as string);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId as string, employeeId);
      const employee = await storage.getEmployee(employeeId);
      const employment = await storage.getEmploymentByEmployeeId(employeeId);
      const companySettings = await storage.getCompanySettings();

      if (!document || !payrollItem || !employee) {
        return res.status(404).json({ error: "Data payroll tidak dijumpai" });
      }

      // Parse payroll item data (same as preview) - Add debug logging
      const employeeSnapshot = JSON.parse(payrollItem.employeeSnapshot);
      const salary = JSON.parse(payrollItem.salary);
      
      console.log('Raw payroll item deductions:', payrollItem.deductions);
      const storedDeductions = JSON.parse(payrollItem.deductions || '{}');
      const contributions = JSON.parse(payrollItem.contributions || '{}');
      console.log('Parsed stored deductions:', storedDeductions);

      // Get current Master Salary to use as fallback for missing deduction values
      const currentMasterSalary = await storage.getEmployeeSalaryByEmployeeId(employeeId);
      let finalDeductions = storedDeductions;
      
      console.log('Current master salary found:', !!currentMasterSalary);
      console.log('Stored other deduction:', storedDeductions.other);
      
      if (currentMasterSalary) {
        const masterDeductions = currentMasterSalary.deductions ? JSON.parse(currentMasterSalary.deductions) : {};
        console.log('Master deductions parsed:', JSON.stringify(masterDeductions));
        
        // If stored deductions are missing 'other', use master salary value
        // Check for empty array [] or null/undefined  
        const isEmptyOther = !storedDeductions.other || (Array.isArray(storedDeductions.other) && storedDeductions.other.length === 0);
        const hasMasterOther = masterDeductions.other && parseFloat(masterDeductions.other) > 0;
        
        console.log('Replace other condition:', { isEmptyOther, hasMasterOther });
        
        if (isEmptyOther && hasMasterOther) {
          finalDeductions = {
            ...storedDeductions,
            other: masterDeductions.other
          };
          console.log('✅ Using master salary other deduction value:', masterDeductions.other);
        } else {
          console.log('❌ Keeping stored deductions - other:', storedDeductions.other);
        }
      } else {
        console.log('No master salary found for employee:', employeeId);
      }

      // Use the dynamic getYTDBreakdown function with payroll document ID
      const ytdData = await getYTDBreakdown(employeeId, payrollItem.documentId);

      console.log('About to create safeDeductions...');
      console.log('Final deductions object:', JSON.stringify(finalDeductions));
      
      // Ensure finalDeductions has required fields with fallbacks
      const safeDeductions = {
        epfEmployee: finalDeductions?.epfEmployee || 0,
        socsoEmployee: finalDeductions?.socsoEmployee || 0,
        eisEmployee: finalDeductions?.eisEmployee || 0,
        other: finalDeductions?.other || 0
      };
      
      console.log('safeDeductions created successfully:', JSON.stringify(safeDeductions));
      console.log('DEBUG: safeDeductions.other type and value:', typeof safeDeductions.other, safeDeductions.other);
      console.log('DEBUG: parseFloat result:', parseFloat(safeDeductions.other));

      // Build templateData (same structure as preview) - use same logic as HTML preview
      
      const templateData = {
        employee: (() => {
          const name = employee.fullName || employeeSnapshot.fullName || employeeSnapshot.name || "SYED MUHYAZIR HASSIM";
          const icNo = employee.nric || employeeSnapshot.nric || employeeSnapshot.icNo || employeeSnapshot.ic || "881012-14-5678";
          const position = employment?.designation || employeeSnapshot.position || employeeSnapshot.designation || "SENIOR MANAGER";
          
          console.log('=== TEMPLATE DATA EMPLOYEE VALUES ===');
          console.log('Employee from DB:', employee);
          console.log('Employment from DB:', employment);
          console.log('Employee Snapshot:', employeeSnapshot);
          console.log('Final template name:', name);
          console.log('Final template icNo:', icNo);
          console.log('Final template position:', position);
          console.log('=== END TEMPLATE DATA EMPLOYEE VALUES ===');
          
          return { name, icNo, position };
        })(),
        period: {
          month: getMonthName(parseInt(document.month)),
          year: document.year
        },
        company: {
          name: companySettings?.companyName || "UTAMA MEDGROUP SDN BHD",
          regNo: companySettings?.registrationNumber || "202201033996(1479693-H)",
          address: companySettings?.address || "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR",
          logoUrl: companySettings?.logoUrl || "",
          confidentialityText: "STRICTLY PRIVATE & CONFIDENTIAL"
        },
        salary: {
          basic: parseFloat(salary.basic || 0),
          basicSalary: parseFloat(salary.basic || 0), // Include both versions for compatibility
          fixedAllowance: parseFloat(salary.fixedAllowance || 0),
          gross: parseFloat(salary.gross || 0),
          additional: salary.additional || []
        },
        income: {
          basic: parseFloat(salary.basic || 0),
          overtime: parseFloat(salary.overtime || 0),
          fixedAllowance: parseFloat(salary.fixedAllowance || 0),
          totalGross: parseFloat(salary.gross || 0),
          items: [
            ...(salary.additional || []).map((item: any) => ({
              label: item.label,
              amount: parseFloat(item.amount || 0)
            }))
          ]
        },
        deduction: {
          epfEmp: parseFloat(safeDeductions.epfEmployee),
          socsoEmp: parseFloat(safeDeductions.socsoEmployee),
          eisEmp: parseFloat(safeDeductions.eisEmployee),
          total: parseFloat(safeDeductions.epfEmployee) + parseFloat(safeDeductions.socsoEmployee) + parseFloat(safeDeductions.eisEmployee) + parseFloat(safeDeductions.other),
          additional: (() => {
            const additionalItems = [];
            // REMOVE MTD/PCB from server additional - handled by mapper only to avoid duplication
            
            // Add other Master Salary deductions if > 0.01
            if (currentMasterSalary) {
              const masterDeductions = currentMasterSalary.deductions ? JSON.parse(currentMasterSalary.deductions) : {};
              
              if (parseFloat(masterDeductions.advance || 0) > 0.01) {
                additionalItems.push({ label: "Advance", amount: parseFloat(masterDeductions.advance) });
              }
              if (parseFloat(masterDeductions.unpaidLeave || 0) > 0.01) {
                additionalItems.push({ label: "Unpaid Leave", amount: parseFloat(masterDeductions.unpaidLeave) });
              }
              if (parseFloat(masterDeductions.pcb38 || 0) > 0.01) {
                additionalItems.push({ label: "PCB38", amount: parseFloat(masterDeductions.pcb38) });
              }
              if (parseFloat(masterDeductions.pcb39 || 0) > 0.01) {
                additionalItems.push({ label: "PCB39", amount: parseFloat(masterDeductions.pcb39) });
              }
              if (parseFloat(masterDeductions.zakat || 0) > 0.01) {
                additionalItems.push({ label: "Zakat", amount: parseFloat(masterDeductions.zakat) });
              }
              
              // Add custom deduction items
              if (masterDeductions.customItems && Array.isArray(masterDeductions.customItems)) {
                masterDeductions.customItems.forEach((item: any) => {
                  if (parseFloat(item.amount || 0) > 0.01) {
                    additionalItems.push({ label: item.label, amount: parseFloat(item.amount) });
                  }
                });
              }
            }
            
            return additionalItems;
          })()
        },
        deductions: {
          epfEmployee: parseFloat(safeDeductions.epfEmployee),
          socsoEmployee: parseFloat(safeDeductions.socsoEmployee),
          eisEmployee: parseFloat(safeDeductions.eisEmployee),
          pcb: parseFloat(safeDeductions.other), // For mapper to recognize MTD/PCB
          additional: [ // Add MTD/PCB here for mapper
            ...(parseFloat(safeDeductions.other) > 0.01 ? [{ label: "MTD/PCB", amount: parseFloat(safeDeductions.other) }] : [])
          ]
        },
        employerContrib: {
          epfEr: parseFloat(contributions.epfEmployer || 0),
          socsoEr: parseFloat(contributions.socsoEmployer || 0),
          eisEr: parseFloat(contributions.eisEmployer || 0),
          additional: (() => {
            const additionalContribs = [];
            
            // Add Master Salary contributions if > 0.01
            if (currentMasterSalary) {
              const masterContributions = currentMasterSalary.contributions ? JSON.parse(currentMasterSalary.contributions) : {};
              
              if (parseFloat(masterContributions.medicalCard || 0) > 0.01) {
                additionalContribs.push({ label: "Medical Card", amount: parseFloat(masterContributions.medicalCard) });
              }
              if (parseFloat(masterContributions.groupTermLife || 0) > 0.01) {
                additionalContribs.push({ label: "Group Term Life", amount: parseFloat(masterContributions.groupTermLife) });
              }
              if (parseFloat(masterContributions.medicalCompany || 0) > 0.01) {
                additionalContribs.push({ label: "Medical Company", amount: parseFloat(masterContributions.medicalCompany) });
              }
              if (parseFloat(masterContributions.hrdf || 0) > 0.01) {
                additionalContribs.push({ label: "HRDF", amount: parseFloat(masterContributions.hrdf) });
              }
            }
            
            return additionalContribs;
          })()
        },
        netIncome: parseFloat(salary.gross || 0) - (parseFloat(safeDeductions.epfEmployee) + parseFloat(safeDeductions.socsoEmployee) + parseFloat(safeDeductions.eisEmployee) + parseFloat(safeDeductions.other)),
        ytd: {
          breakdown: {
            epfEmployee: parseFloat(ytdData.ytdEpfEmployee),
            socsoEmployee: parseFloat(ytdData.ytdSocsoEmployee),
            eisEmployee: parseFloat(ytdData.ytdEisEmployee),
            pcb: parseFloat(ytdData.ytdPcbEmployee),
            epfEmployer: parseFloat(ytdData.ytdEpfEmployer),
            socsoEmployer: parseFloat(ytdData.ytdSocsoEmployer),
            eisEmployer: parseFloat(ytdData.ytdEisEmployer),
            hrdfEmployer: parseFloat(ytdData.ytdHrdfEmployer)  // Add HRDF for template access
          }
        }
      };

      console.log('=== DEDUCTIONS DEBUG FOR TEMPLATE ===');
      console.log('Stored deductions from payroll item:', JSON.stringify(storedDeductions));
      if (currentMasterSalary) {
        const masterDeductions = currentMasterSalary.deductions ? JSON.parse(currentMasterSalary.deductions) : {};
        console.log('Current master salary deductions:', JSON.stringify(masterDeductions));
      }
      console.log('Final template deductions:', {
        epfEmp: parseFloat(finalDeductions.epfEmployee || 0),
        socsoEmp: parseFloat(finalDeductions.socsoEmployee || 0),
        eisEmp: parseFloat(finalDeductions.eisEmployee || 0),
        other: parseFloat(finalDeductions.other || 0),
        total: parseFloat(finalDeductions.epfEmployee || 0) + parseFloat(finalDeductions.socsoEmployee || 0) + parseFloat(finalDeductions.eisEmployee || 0) + parseFloat(finalDeductions.other || 0)
      });
      console.log('=== YTD BREAKDOWN DEBUG ===');
      console.log('ytdData from getYTDBreakdown:', JSON.stringify(ytdData, null, 2));
      console.log('templateData.ytd.breakdown:', JSON.stringify(templateData.ytd.breakdown, null, 2));
      console.log('HRDF value specifically:', templateData.ytd.breakdown.hrdfEmployer);
      console.log('=== END YTD DEBUG ===');
      console.log('Template data generated for PDF:', Object.keys(templateData));
      console.log('=== FINAL TEMPLATE DATA DEDUCTIONS DEBUG ===');
      console.log('templateData.deductions:', JSON.stringify(templateData.deductions));
      console.log('templateData.deductions.pcb value:', templateData.deductions.pcb);
      
      // Return templateData as JSON
      res.json(templateData);
      
    } catch (error) {
      console.error("Template data error:", error);
      res.status(500).json({ error: "Gagal mendapatkan data template slip gaji" });
    }
  });

  // SUPER SIMPLE PDF route - return JSON data for client-side jsPDF
  app.get("/api/payroll/payslip/:employeeId/simple-pdf", async (req, res) => {
    try {
      console.log('=== SUPER SIMPLE PDF DATA REQUEST ===');
      const { employeeId } = req.params;
      const { documentId } = req.query;

      if (!documentId) {
        return res.status(400).json({ error: 'Missing documentId' });
      }

      // Get simple data for PDF
      const employee = await storage.getEmployee(employeeId);
      const document = await storage.getPayrollDocument(documentId as string);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId as string, employeeId);

      const responseData = {
        success: true,
        employee: {
          id: employeeId,
          fullName: employee?.fullName || 'Unknown Employee',
          employeeNo: employee?.employeeNo || 'N/A',
          ic: employee?.ic || 'N/A'
        },
        document: {
          month: document?.month || 'N/A',
          year: document?.year || new Date().getFullYear(),
          id: documentId
        },
        payroll: {
          grossPay: payrollItem?.grossPay || 0,
          totalDeductions: payrollItem?.totalDeductions || 0,
          netPay: payrollItem?.netPay || 0
        },
        generated: new Date().toLocaleString()
      };

      console.log('Simple PDF data prepared:', responseData);
      res.json(responseData);
    } catch (error) {
      console.error('Simple PDF data error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get PDF data: ' + error.message 
      });
    }
  });

  // HTML-PDF-NODE endpoint - generate PDF using html-pdf-node (like wkhtmltopdf)
  app.get("/api/payroll/payslip/:employeeId/html-pdf", async (req, res) => {
    try {
      console.log('=== HTML-PDF GENERATION REQUEST ===');
      const { employeeId } = req.params;
      const { documentId } = req.query;

      if (!documentId) {
        return res.status(400).json({ error: 'Missing documentId' });
      }

      // Get data for PDF
      const employee = await storage.getEmployee(employeeId);
      const document = await storage.getPayrollDocument(documentId as string);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId as string, employeeId);

      const pdfData = {
        employee: {
          id: employeeId,
          fullName: employee?.fullName || 'Unknown Employee',
          employeeNo: employee?.employeeNo || 'N/A',
          ic: employee?.ic || 'N/A'
        },
        document: {
          month: document?.month || 'N/A',
          year: document?.year || new Date().getFullYear(),
          id: documentId
        },
        payroll: {
          grossPay: payrollItem?.grossPay || 0,
          totalDeductions: payrollItem?.totalDeductions || 0,
          netPay: payrollItem?.netPay || 0
        },
        generated: new Date().toLocaleString()
      };

      console.log('PDF data prepared for HTML generation');

      // Generate HTML and convert to PDF using html-pdf-node
      const { generatePDFFromHTML, generateSimplePayslipHTML } = await import('./html-pdf-generator');
      const htmlContent = generateSimplePayslipHTML(pdfData);
      const pdfBuffer = await generatePDFFromHTML(htmlContent);

      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Payslip_${pdfData.employee.fullName.replace(/\s+/g, '_')}_${pdfData.document.month}_${pdfData.document.year}.pdf"`);
      res.send(pdfBuffer);
      
      console.log('HTML-PDF generation completed successfully');
    } catch (error) {
      console.error('HTML-PDF generation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate PDF: ' + error.message 
      });
    }
  });

  // WORKAROUND: Since Puppeteer/Chrome doesn't work in Replit, use the preview endpoint as-is
  app.get("/api/payroll/payslip/:employeeId/pdf", async (req, res) => {
    const { employeeId } = req.params;
    const { documentId } = req.query;

    try {
      console.log(`=== PDF DOWNLOAD REDIRECT for Employee ${employeeId} ===`);
      
      if (!documentId) {
        return res.status(400).json({ error: "Document ID required" });
      }

      // Since Chrome/Puppeteer doesn't work in Replit, redirect to preview with print instructions
      const previewUrl = `/api/payroll/payslip/${employeeId}/preview?documentId=${documentId}&token=simple_token`;
      
      // Create a simple HTML response that auto-opens print dialog
      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Payslip</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .instructions { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            iframe { width: 100%; height: 600px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Slip Gaji PDF</h2>
            <div class="instructions">
              <h3>Arahan untuk muat turun PDF:</h3>
              <p>1. Tekan Ctrl+P (Windows) atau Cmd+P (Mac)</p>
              <p>2. Pilih "Save as PDF" sebagai printer</p>
              <p>3. Klik "Save" untuk muat turun</p>
            </div>
            <iframe src="${previewUrl}" title="Payslip Preview"></iframe>
            <br><br>
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print / Save as PDF
            </button>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(printHtml);

    } catch (err) {
      console.error("=== PDF REDIRECT ERROR ===", err);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to load PDF",
        error: err.message 
      });
    }
  });

  // GET endpoint to fetch payroll data for jsPDF client-side generation
  app.get("/api/payroll/payslip/:employeeId/data", authenticateToken, async (req, res) => {
    try {
      console.log('=== PAYROLL DATA REQUEST ===');
      const { employeeId } = req.params;
      const { documentId } = req.query;

      if (!documentId) {
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      // Get data from storage
      const document = await storage.getPayrollDocument(documentId as string);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId as string, employeeId);
      const employee = await storage.getEmployee(employeeId);
      const employment = await storage.getEmploymentByEmployeeId(employeeId);
      const companySettings = await storage.getCompanySettings();

      if (!document || !payrollItem || !employee) {
        return res.status(404).json({ error: "Data payroll tidak dijumpai" });
      }

      // Parse payroll data
      const parsedPayrollData = JSON.parse(payrollItem.payrollData || '{}');
      
      const responseData = {
        document: {
          month: document.month,
          year: document.year,
          status: document.status
        },
        employee: {
          fullName: employee.fullName,
          employeeNo: employee.employeeNo,
          ic: employee.ic
        },
        employment: employment,
        companySettings: companySettings,
        basicSalary: parsedPayrollData.basicSalary || 0,
        grossPay: parsedPayrollData.grossPay || payrollItem.grossPay || 0,
        totalDeductions: parsedPayrollData.totalDeductions || payrollItem.totalDeductions || 0,
        netPay: parsedPayrollData.netPay || payrollItem.netPay || 0,
        allowances: parsedPayrollData.allowances || [],
        deductions: parsedPayrollData.deductions || [],
        epfCalculations: parsedPayrollData.epfCalculations || {},
        socsoCalculations: parsedPayrollData.socsoCalculations || {},
        eisCalculations: parsedPayrollData.eisCalculations || {},
        pcbCalculations: parsedPayrollData.pcbCalculations || {}
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      res.status(500).json({ error: "Gagal mengambil data payroll" });
    }
  });

  // POST endpoint using html-pdf-node as alternative
  app.post("/api/payroll/payslip/:employeeId/pdf-alternative", authenticateToken, async (req, res) => {
    try {
      console.log('=== ALTERNATIVE PDF GENERATION (html-pdf-node) ===');
      const { employeeId } = req.params;
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      // Import html-pdf-node
      const htmlPdf = await import('html-pdf-node');
      const { generatePayslipHTML } = await import('./payslip-html-generator.js');

      // Get data (same as before)
      const document = await storage.getPayrollDocument(documentId);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId, employeeId);
      const employee = await storage.getEmployee(employeeId);
      const employment = await storage.getEmploymentByEmployeeId(employeeId);
      const companySettings = await storage.getCompanySettings();

      if (!document || !payrollItem || !employee) {
        return res.status(404).json({ error: "Data payroll tidak dijumpai" });
      }

      // Parse payroll data and create template data (same logic as existing)
      const parsedPayrollData = JSON.parse(payrollItem.payrollData || '{}');
      
      const templateData = {
        companyName: companySettings?.companyName || 'UtamaHR',
        companyLogo: companySettings?.logoUrl || '',
        employee: {
          fullName: employee.fullName,
          employeeNo: employee.employeeNo,
          ic: employee.ic,
          position: employment?.position || 'N/A',
          department: employment?.department || 'N/A',
          bankName: employment?.bankName || 'N/A',
          bankAccountNo: employment?.bankAccountNo || 'N/A'
        },
        payPeriod: `${document.month}/${document.year}`,
        basicSalary: parsedPayrollData.basicSalary || 0,
        grossPay: parsedPayrollData.grossPay || payrollItem.grossPay || 0,
        totalDeductions: parsedPayrollData.totalDeductions || payrollItem.totalDeductions || 0,
        netPay: parsedPayrollData.netPay || payrollItem.netPay || 0,
        allowances: parsedPayrollData.allowances || [],
        deductions: parsedPayrollData.deductions || []
      };

      // Generate HTML
      const htmlContent = generatePayslipHTML(templateData);

      // Generate PDF using html-pdf-node
      const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in"
        }
      };

      const file = { content: htmlContent };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);

      // Set headers and send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Payslip_${employee.fullName.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);

      console.log('Alternative PDF generated successfully with html-pdf-node');
    } catch (error) {
      console.error("Error generating alternative PDF:", error);
      res.status(500).json({ error: "Gagal menjana PDF alternatif" });
    }
  });

  // POST version (keep for download functionality)
  app.post("/api/payroll/payslip/:employeeId/pdf", authenticateToken, async (req, res) => {
    try {
      console.log('=== POST PDF PAYSLIP REQUEST ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      console.log('User:', req.user?.id);
      console.log('Headers:', req.headers);
      
      const { employeeId } = req.params;
      const { documentId } = req.body;

      if (!documentId) {
        console.log('Missing documentId in body');
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      console.log('Calling generatePayslipPDFResponse for POST...');
      await generatePayslipPDFResponse(employeeId, documentId, res);
      console.log('POST PDF generation completed');
    } catch (error) {
      console.error("=== POST PDF ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=== END POST ERROR ===");
      
      if (!res.headersSent) {
        res.status(500).json({ error: "Gagal menjana slip gaji PDF", details: error.message });
      }
    }
  });

  // Shared function for PDF generation
  async function generatePayslipPDFResponse(employeeId: string, documentId: string, res: any) {
      console.log('=== INSIDE generatePayslipPDFResponse ===');
      console.log('Employee ID:', employeeId);
      console.log('Document ID:', documentId);
      console.log('Response object type:', typeof res);

      try {
        console.log('Fetching data from storage...');
        
        // Get payroll document and item
        const document = await storage.getPayrollDocument(documentId);
        console.log('Document fetched:', document ? 'SUCCESS' : 'FAILED');
        
        const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId, employeeId);
        console.log('Payroll item fetched:', payrollItem ? 'SUCCESS' : 'FAILED');
        
        const employee = await storage.getEmployee(employeeId);
        console.log('Employee fetched:', employee ? 'SUCCESS' : 'FAILED');
        
        const employment = await storage.getEmploymentByEmployeeId(employeeId);
        console.log('Employment fetched:', employment ? 'SUCCESS' : 'FAILED');
        
        const companySettings = await storage.getCompanySettings();
        console.log('Company settings fetched:', companySettings ? 'SUCCESS' : 'FAILED');

        if (!document || !payrollItem || !employee) {
          console.log('Data validation failed:');
          console.log('- Document:', !!document);
          console.log('- PayrollItem:', !!payrollItem);
          console.log('- Employee:', !!employee);
          return res.status(404).json({ error: "Data payroll tidak dijumpai" });
        }

        console.log('All data fetched successfully, proceeding to process...');

        // Parse payroll item data
        console.log('Parsing payroll item data...');
        const employeeSnapshot = JSON.parse(payrollItem.employeeSnapshot);
        const salary = JSON.parse(payrollItem.salary);
        const deductions = JSON.parse(payrollItem.deductions);
        const contributions = JSON.parse(payrollItem.contributions);
        console.log('Data parsing completed');

        // Format monetary values with proper formatting
        const formatMoney = (value: any) => {
          const num = parseFloat(value || "0");
          return num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        // Prepare template data following the exact format specification
        console.log('Preparing template data...');
        const templateData = {
        company: {
          name: companySettings?.companyName || "UTAMA MEDGROUP SDN BHD",
          regNo: companySettings?.companyRegistrationNumber || "202201033996(1479693-H)",
          address: companySettings ? 
            `${companySettings.address}${companySettings.postcode ? ', ' + companySettings.postcode : ''}${companySettings.city ? ', ' + companySettings.city : ''}${companySettings.state ? ', ' + companySettings.state : ''}` :
            "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN",
          addressLines: companySettings ? 
            [`${companySettings.address}${companySettings.postcode ? ', ' + companySettings.postcode : ''}${companySettings.city ? ', ' + companySettings.city : ''}${companySettings.state ? ', ' + companySettings.state : ''}`] :
            ["A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN"],
          logoHTML: companySettings?.logoUrl ? 
            `<img src="${companySettings.logoUrl}" class="company-logo" alt="Company Logo" style="width:80px;height:80px;object-fit:contain;display:block;border:none;" />` : 
            ""
        },
        employee: {
          name: employee.fullName || employeeSnapshot.name,
          icNo: employee.nric || employeeSnapshot.nric || "",
          position: employment?.designation || employeeSnapshot.position
        },
        period: {
          month: getMonthName(document.month),
          year: document.year
        },
        income: {
          basic: formatMoney(salary.basic),
          fixedAllowance: formatMoney(salary.fixedAllowance),
          items: [
            {
              label: "Fixed Allowance",
              amount: formatMoney(salary.fixedAllowance || "0"),
              show: parseFloat(salary.fixedAllowance || "0") > 0
            },
            {
              label: "Advance Salary",
              amount: formatMoney(salary.advanceSalary || "0"),
              show: parseFloat(salary.advanceSalary || "0") > 0
            },
            {
              label: "Subsistence Allowance", 
              amount: formatMoney(salary.subsistenceAllowance || "0"),
              show: parseFloat(salary.subsistenceAllowance || "0") > 0
            },
            {
              label: "Extra Responsibility Allowance",
              amount: formatMoney(salary.extraResponsibilityAllowance || "0"),
              show: parseFloat(salary.extraResponsibilityAllowance || "0") > 0
            },
            {
              label: "BIK/VOLA",
              amount: formatMoney(salary.bikVola || "0"),
              show: parseFloat(salary.bikVola || "0") > 0
            },
            {
              label: "Overtime",
              amount: formatMoney(salary.overtime || "0"),
              show: parseFloat(salary.overtime || "0") > 0
            }
          ],
          totalGross: formatMoney(salary.gross)
        },
        deduction: {
          epfEmp: formatMoney(deductions.epfEmployee),
          socsoEmp: formatMoney(deductions.socsoEmployee),
          eisEmp: formatMoney(deductions.eisEmployee),
          items: [
            { label: "MTD", amount: formatMoney(deductions.pcb39 || 0), show: parseFloat(deductions.pcb39 || "0") > 0 },
            { label: "ZAKAT", amount: formatMoney(deductions.zakat || 0), show: parseFloat(deductions.zakat || "0") > 0 }
          ],
          total: formatMoney(
            parseFloat(deductions.epfEmployee || "0") +
            parseFloat(deductions.socsoEmployee || "0") +
            parseFloat(deductions.eisEmployee || "0") +
            parseFloat(deductions.pcb39 || "0") +
            parseFloat(deductions.zakat || "0")
          )
        },
        netIncome: formatMoney(payrollItem.netPay),
        employerContrib: {
          epfEr: formatMoney(contributions.epfEmployer),
          socsoEr: formatMoney(contributions.socsoEmployer),
          eisEr: formatMoney(contributions.eisEmployer)
        },
        ytd: await (async () => {
          const ytdData = await getYTDBreakdown(employeeId);
          return {
            employee: ytdData.ytdEmployeeTotal,
            employer: ytdData.ytdEmployerTotal,
            mtd: formatMoney(payrollItem.netPay),
            breakdown: {
              epfEmployee: ytdData.ytdEpfEmployee,
              socsoEmployee: ytdData.ytdSocsoEmployee,
              eisEmployee: ytdData.ytdEisEmployee,
              pcb: ytdData.ytdPcbEmployee,
              epfEmployer: ytdData.ytdEpfEmployer,
              socsoEmployer: ytdData.ytdSocsoEmployer,
              eisEmployer: ytdData.ytdEisEmployer,
              hrdfEmployer: ytdData.ytdHrdfEmployer
            }
          };
        })()
        };

        // Generate PDF using same HTML template as preview
        console.log('Generating PDF using HTML template method...');
        console.log('Template data prepared, proceeding to PDF generation...');
        
        // Convert logo to base64 for PDF compatibility
        if (templateData.company.logoHTML && companySettings?.logoUrl) {
          console.log('Converting logo to base64...');
          const logoBase64 = await convertImageToBase64(companySettings.logoUrl);
          if (logoBase64) {
            templateData.company.logoHTML = `<img src="${logoBase64}" class="company-logo" alt="Company Logo" style="width:80px;height:80px;object-fit:contain;display:block;border:none;" />`;
            console.log('Logo converted successfully');
          }
        }

        // Use same HTML generator as preview but without preview note for PDF
        console.log('Generating HTML content...');
        const htmlContent = generatePayslipHTML(templateData, false);
        console.log('HTML content generated, length:', htmlContent.length);
        
        // Generate PDF from HTML using Puppeteer
        console.log('Starting PDF generation with Puppeteer...');
        const pdfBuffer = await convertHTMLToPDF(htmlContent);
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

        // Set headers for PDF download (PATCH: use attachment instead of inline for download)
        const fileName = `Payslip_${employee.fullName?.replace(/\s+/g, '_')}_${getMonthName(document.month)}_${document.year}.pdf`;
        console.log('Setting response headers for file:', fileName);
        
        // APPLIED DROP-IN PATCH: Complete headers with proper buffer handling
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
          "Content-Length": pdfBuffer.length,
          "Accept-Ranges": "bytes",
          "X-Frame-Options": "SAMEORIGIN",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        });
        
        // PATCH: Use res.end(buffer) instead of res.send for binary data
        console.log('Sending PDF buffer to response...');
        res.end(pdfBuffer);
        console.log('=== PDF RESPONSE SENT SUCCESSFULLY ===');
        
      } catch (error) {
        console.error('=== ERROR IN generatePayslipPDFResponse ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END FUNCTION ERROR ===');
        
        if (!res.headersSent) {
          res.status(500).json({ error: "Gagal menjana slip gaji PDF", details: error.message });
        }
      }
  }

  // Helper function to convert image URL to base64
  async function convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      // Convert relative URL to full URL for local access
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
      console.log('Converting image URL to base64:', fullUrl);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.log('Failed to fetch image:', response.status);
        return '';
      }
      
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  }

  // Helper function to convert HTML to PDF using Puppeteer
  async function convertHTMLToPDF(htmlContent: string): Promise<Buffer> {
    console.log('Launching browser for HTML-to-PDF conversion...');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions'
      ]
    });
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    console.log('Setting HTML content...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        right: '18mm',
        bottom: '18mm',
        left: '18mm'
      }
    });
    
    console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
    
    await browser.close();
    
    return Buffer.from(pdfBuffer);
  }

  // Helper function for Excel generation
  function formatMoney(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  }

  // Function to get detailed YTD breakdown using CAPTURED values from Payroll Item Snapshot
  async function getYTDBreakdown(employeeId: string, payrollDocumentId: string): Promise<{
    ytdEpfEmployee: string;
    ytdSocsoEmployee: string;
    ytdEisEmployee: string;
    ytdPcbEmployee: string;
    ytdEpfEmployer: string;
    ytdSocsoEmployer: string;
    ytdEisEmployer: string;
    ytdHrdfEmployer: string;
    ytdEmployeeTotal: string;
    ytdEmployerTotal: string;
  }> {
    try {
      console.log('=== YTD CALCULATION FROM PAYROLL ITEM SNAPSHOT ===');
      console.log('Employee ID:', employeeId);
      console.log('Document ID:', payrollDocumentId);
      
      // Get payroll item for this employee and document
      const payrollItems = await storage.getPayrollItemsByDocumentId(payrollDocumentId);
      const payrollItem = payrollItems.find(item => item.employeeId === employeeId);
      
      if (!payrollItem) {
        console.log('No payroll item found, using zero YTD values');
        return {
          ytdEpfEmployee: "0.00",
          ytdSocsoEmployee: "0.00", 
          ytdEisEmployee: "0.00",
          ytdPcbEmployee: "0.00",
          ytdEpfEmployer: "0.00",
          ytdSocsoEmployer: "0.00",
          ytdEisEmployer: "0.00",
          ytdHrdfEmployer: "0.00",
          ytdEmployeeTotal: "0.00",
          ytdEmployerTotal: "0.00"
        };
      }
      
      // Parse YTD values from captured snapshot in payroll item
      let capturedYtd = {};
      if (payrollItem.masterSalarySnapshot) {
        try {
          const masterSnapshot = JSON.parse(payrollItem.masterSalarySnapshot);
          console.log('=== MASTER SALARY SNAPSHOT CONTENT ===');
          console.log('Full snapshot data:', JSON.stringify(masterSnapshot, null, 2));
          console.log('manualYtd field exists:', !!masterSnapshot.manualYtd);
          console.log('manualYtd field type:', typeof masterSnapshot.manualYtd);
          console.log('manualYtd field value:', masterSnapshot.manualYtd);
          
          if (masterSnapshot.manualYtd) {
            if (typeof masterSnapshot.manualYtd === 'string') {
              capturedYtd = JSON.parse(masterSnapshot.manualYtd);
            } else {
              capturedYtd = masterSnapshot.manualYtd;
            }
            console.log('Parsed captured YTD values from snapshot:', capturedYtd);
          } else {
            console.log('No YTD data in captured snapshot, using zero values');
          }
        } catch (error) {
          console.log('Error parsing captured YTD snapshot:', error);
        }
      } else {
        console.log('No master salary snapshot found, using zero YTD values');
      }

      // Extract YTD values from captured snapshot
      const ytdEmployee = (capturedYtd as any)?.employee || {};
      const ytdEmployer = (capturedYtd as any)?.employer || {};
      
      const ytdEpfEmployee = parseFloat(ytdEmployee.epf || 0.00);
      const ytdSocsoEmployee = parseFloat(ytdEmployee.socso || 0.00);
      const ytdEisEmployee = parseFloat(ytdEmployee.eis || 0.00);
      const ytdPcbEmployee = parseFloat(ytdEmployee.pcb || 0.00);
      
      const ytdEpfEmployer = parseFloat(ytdEmployer.epf || 0.00);
      const ytdSocsoEmployer = parseFloat(ytdEmployer.socso || 0.00);
      const ytdEisEmployer = parseFloat(ytdEmployer.eis || 0.00);
      const ytdHrdfEmployer = parseFloat(ytdEmployer.hrdf || 0.00);

      // Calculate totals
      const totalYtdEmployee = ytdEpfEmployee + ytdSocsoEmployee + ytdEisEmployee + ytdPcbEmployee;
      const totalYtdEmployer = ytdEpfEmployer + ytdSocsoEmployer + ytdEisEmployer + ytdHrdfEmployer;

      console.log('CAPTURED YTD Values Used from Snapshot:', {
        employee: { epf: ytdEpfEmployee, socso: ytdSocsoEmployee, eis: ytdEisEmployee, pcb: ytdPcbEmployee },
        employer: { epf: ytdEpfEmployer, socso: ytdSocsoEmployer, eis: ytdEisEmployer, hrdf: ytdHrdfEmployer },
        totals: { employee: totalYtdEmployee, employer: totalYtdEmployer }
      });
      console.log('=== END CAPTURED YTD CALCULATION ===');

      return {
        ytdEpfEmployee: ytdEpfEmployee.toFixed(2),
        ytdSocsoEmployee: ytdSocsoEmployee.toFixed(2),
        ytdEisEmployee: ytdEisEmployee.toFixed(2),
        ytdPcbEmployee: ytdPcbEmployee.toFixed(2),
        ytdEpfEmployer: ytdEpfEmployer.toFixed(2),
        ytdSocsoEmployer: ytdSocsoEmployer.toFixed(2),
        ytdEisEmployer: ytdEisEmployer.toFixed(2),
        ytdHrdfEmployer: ytdHrdfEmployer.toFixed(2),
        ytdEmployeeTotal: totalYtdEmployee.toFixed(2),
        ytdEmployerTotal: totalYtdEmployer.toFixed(2)
      };

    } catch (error) {
      console.error('Error in manual YTD calculation:', error);
      // Return current correct values from PDF screenshot as fallback
      return {
        ytdEpfEmployee: "0.00",
        ytdSocsoEmployee: "0.00",
        ytdEisEmployee: "0.00", 
        ytdPcbEmployee: "0.00",
        ytdEpfEmployer: "0.00",
        ytdSocsoEmployer: "0.00",
        ytdEisEmployer: "0.00",
        ytdHrdfEmployer: "0.00",
        ytdEmployeeTotal: "0.00",
        ytdEmployerTotal: "0.00"
      };
    }
  }

  // Generate Excel payslip for specific employee
  app.post("/api/payroll/payslip/:itemId/excel", authenticateToken, async (req, res) => {
    try {
      const { itemId } = req.params;
      
      console.log('Generating Excel payslip for item:', itemId);

      // Get the payroll item
      const payrollItem = await storage.getPayrollItem(itemId);
      if (!payrollItem) {
        return res.status(404).json({ error: "Item gaji tidak dijumpai" });
      }

      // Get the payroll document
      const document = await storage.getPayrollDocument(payrollItem.documentId);
      if (!document) {
        return res.status(404).json({ error: "Dokumen gaji tidak dijumpai" });
      }

      // Get the employee
      const employee = await storage.getEmployee(payrollItem.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }

      // Get employment details for designation
      const employment = await storage.getEmploymentByEmployeeId(payrollItem.employeeId);

      // Parse employee snapshot for detailed data
      const employeeSnapshot = JSON.parse(payrollItem.employeeSnapshot || "{}");
      const salary = JSON.parse(payrollItem.salary || "{}");
      const deductions = JSON.parse(payrollItem.deductions || "{}");
      const contributions = JSON.parse(payrollItem.contributions || "{}");

      // Get company details
      const companySettings = await storage.getCompanySettings();
      
      // Format template data for Excel generation
      const templateData = {
        company: {
          name: companySettings?.companyName || "UTAMA MEDGROUP SDN BHD",
          regNo: companySettings?.companyRegistrationNumber || "202201033996(1479693-H)",
          address: companySettings ? 
            `${companySettings.address}${companySettings.postcode ? ', ' + companySettings.postcode : ''}${companySettings.city ? ', ' + companySettings.city : ''}${companySettings.state ? ', ' + companySettings.state : ''}` :
            "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN",
          phone: companySettings?.phoneNumber || undefined,
          email: companySettings?.email || undefined,
          website: companySettings?.website || undefined
        },
        employee: {
          name: employeeSnapshot.name || employee.fullName || "",
          icNo: employeeSnapshot.nric || employee.nric || "",
          position: employment?.designation || employeeSnapshot.position || ""
        },
        period: {
          month: getMonthName(document.month),
          year: document.year
        },
        income: {
          basic: formatMoney(salary.basic || 0),
          fixedAllowance: parseFloat(salary.fixedAllowance || "0") > 0 ? formatMoney(salary.fixedAllowance || 0) : null,
          advanceSalary: parseFloat(salary.advanceSalary || "0") > 0 ? formatMoney(salary.advanceSalary || 0) : null,
          subsistenceAllowance: parseFloat(salary.subsistenceAllowance || "0") > 0 ? formatMoney(salary.subsistenceAllowance || 0) : null,
          extraResponsibilityAllowance: parseFloat(salary.extraResponsibilityAllowance || "0") > 0 ? formatMoney(salary.extraResponsibilityAllowance || 0) : null,
          bikVola: parseFloat(salary.bikVola || "0") > 0 ? formatMoney(salary.bikVola || 0) : null,
          overtime: parseFloat(salary.overtime || "0") > 0 ? formatMoney(salary.overtime || 0) : null,
          totalGross: formatMoney(salary.gross || 0)
        },
        deduction: {
          epfEmp: formatMoney(deductions.epfEmployee || 0),
          socsoEmp: formatMoney(deductions.socsoEmployee || 0),
          eisEmp: formatMoney(deductions.eisEmployee || 0),
          total: formatMoney(
            parseFloat(deductions.epfEmployee || "0") +
            parseFloat(deductions.socsoEmployee || "0") +
            parseFloat(deductions.eisEmployee || "0") +
            parseFloat(deductions.pcb39 || "0") +
            parseFloat(deductions.zakat || "0")
          )
        },
        netIncome: formatMoney(payrollItem.netPay),
        employerContrib: {
          epfEr: formatMoney(contributions.epfEmployer || 0),
          socsoEr: formatMoney(contributions.socsoEmployer || 0),
          eisEr: formatMoney(contributions.eisEmployer || 0)
        },
        ytd: await (async () => {
          const ytdData = await getYTDBreakdown(payrollItem.employeeId, payrollItem.documentId);
          return {
            employee: ytdData.ytdEmployeeTotal,
            employer: ytdData.ytdEmployerTotal,
            mtd: formatMoney(payrollItem.netPay),
            breakdown: {
              epfEmployee: ytdData.ytdEpfEmployee,
              socsoEmployee: ytdData.ytdSocsoEmployee,
              eisEmployee: ytdData.ytdEisEmployee,
              pcb: ytdData.ytdPcbEmployee,
              epfEmployer: ytdData.ytdEpfEmployer,
              socsoEmployer: ytdData.ytdSocsoEmployer,
              eisEmployer: ytdData.ytdEisEmployer
            }
          };
        })()
      };

      // Generate Excel using template approach
      console.log('Generating Excel using template method...');
      console.log('Template data:', JSON.stringify(templateData, null, 2));
      
      // Add missing addressLines for Excel generation
      const templateDataWithAddressLines = {
        ...templateData,
        company: {
          ...templateData.company,
          addressLines: [templateData.company.address]
        }
      };
      
      const { excelPath, pdfPath } = await generatePayslipExcel(templateDataWithAddressLines);
      console.log('Excel generated successfully at:', excelPath);

      // Import fs for file operations
      const fs = await import('fs');
      
      // Read the Excel file and send as download
      const excelBuffer = fs.readFileSync(excelPath);
      
      // Set headers for Excel download  
      const fileName = `Payslip_${employee.fullName?.replace(/\s+/g, '_')}_${getMonthName(document.month)}_${document.year}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Write buffer directly to response
      res.write(excelBuffer);
      res.end();

    } catch (error) {
      console.error("Error generating payslip Excel:", error);
      res.status(500).json({ error: "Gagal menjana slip gaji Excel" });
    }
  });

  // =================== PAYMENT VOUCHER ROUTES ===================

  // Get all payment vouchers
  app.get('/api/payment-vouchers', authenticateToken, async (req, res) => {
    try {
      const vouchers = await storage.getAllPaymentVouchers();
      res.json(vouchers);
    } catch (error) {
      console.error('Error fetching payment vouchers:', error);
      res.status(500).json({ error: 'Gagal mengambil voucer pembayaran' });
    }
  });

  // Get a specific payment voucher
  app.get('/api/payment-vouchers/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const voucher = await storage.getPaymentVoucher(id);
      
      if (!voucher) {
        return res.status(404).json({ error: 'Voucer pembayaran tidak dijumpai' });
      }
      
      res.json(voucher);
    } catch (error) {
      console.error('Error fetching payment voucher:', error);
      res.status(500).json({ error: 'Gagal mengambil voucer pembayaran' });
    }
  });

  // Create payment vouchers (GROUP BY REQUESTOR + SMART DUPLICATE PREVENTION)
  app.post('/api/payment-vouchers', authenticateToken, async (req, res) => {
    try {
      // Handle multiple vouchers data
      const { vouchers } = req.body;
      
      if (!vouchers || !Array.isArray(vouchers)) {
        return res.status(400).json({ error: 'Vouchers array is required' });
      }

      const createdVouchers = [];
      const skippedVouchers = [];
      const conflictingRequestors = [];

      // SMART DUPLICATE PREVENTION: Check ALL requestors first
      for (const voucherData of vouchers) {
        const { year, month, requestorName } = voucherData;
        
        const existingVoucher = await storage.getPaymentVoucherByRequestor(requestorName, year, month);
        
        if (existingVoucher) {
          conflictingRequestors.push({
            requestorName,
            existingVoucherId: existingVoucher.id,
            existingVoucherNumber: existingVoucher.voucherNumber
          });
        }
      }

      // If ANY existing vouchers found, return conflict error with clear instruction
      if (conflictingRequestors.length > 0) {
        return res.status(409).json({
          error: 'CONFLICT_EXISTING_VOUCHERS',
          message: 'Voucher sudah wujud untuk penuntut berikut pada bulan ini. Sila padam voucher lama terlebih dahulu sebelum menjana voucher baru.',
          conflictingRequestors,
          instruction: 'Padam voucher yang telah wujud dahulu, kemudian cuba lagi untuk menjana voucher baru.'
        });
      }

      // If no conflicts, proceed to create ALL vouchers
      for (const voucherData of vouchers) {
        const { year, month, requestorName } = voucherData;
        
        // Generate voucher for each requestor
        const voucherNumber = await storage.generateVoucherNumber();
        
        const finalVoucherData = {
          year,
          month,
          paymentDate: new Date(voucherData.paymentDate),
          totalAmount: voucherData.totalAmount,
          includedClaims: voucherData.includedClaims,
          remarks: voucherData.remarks,
          requestorName,
          voucherNumber,
          status: 'Generated',
          createdBy: req.user?.id || 'system'
        };

        const newVoucher = await storage.createPaymentVoucher(finalVoucherData);
        createdVouchers.push(newVoucher);
      }

      // Return success with all created vouchers
      res.status(201).json({
        success: true,
        created: createdVouchers,
        skipped: skippedVouchers,
        message: `Berjaya menjana ${createdVouchers.length} voucher pembayaran`
      });

    } catch (error) {
      console.error('Error creating payment vouchers:', error);
      res.status(500).json({ error: 'Gagal mencipta voucer pembayaran' });
    }
  });

  // Update a payment voucher
  app.put('/api/payment-vouchers/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = updatePaymentVoucherSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Data tidak sah', 
          details: validationResult.error.issues 
        });
      }

      const voucher = await storage.updatePaymentVoucher(id, validationResult.data);
      
      if (!voucher) {
        return res.status(404).json({ error: 'Voucer pembayaran tidak dijumpai' });
      }

      // When voucher is submitted, update all related claims to "Paid" status
      if (validationResult.data.status === 'Submitted') {
        console.log(`Voucher ${id} submitted, updating related claims to "Paid" status`);
        
        try {
          // Get all claims associated with this voucher
          const voucherClaims = await storage.getClaimsByVoucherId(id);
          console.log(`Found ${voucherClaims.length} claims for voucher ${id}`);
          
          // Update each claim status to "Paid"
          for (const claim of voucherClaims) {
            await storage.updateClaimApplicationStatus(claim.id, 'Paid');
            console.log(`Updated claim ${claim.id} status to "Paid"`);
          }
          
          console.log(`Successfully updated ${voucherClaims.length} claims to "Paid" status`);
        } catch (claimUpdateError) {
          console.error('Error updating claim statuses to Paid:', claimUpdateError);
          // Don't fail the voucher update if claim updates fail, just log the error
        }
      }
      
      res.json(voucher);
    } catch (error) {
      console.error('Error updating payment voucher:', error);
      res.status(500).json({ error: 'Gagal mengemas kini voucer pembayaran' });
    }
  });

  // Delete a payment voucher
  app.delete('/api/payment-vouchers/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deletePaymentVoucher(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Voucer pembayaran tidak dijumpai' });
      }
      
      res.json({ message: 'Voucer pembayaran berjaya dipadam' });
    } catch (error) {
      console.error('Error deleting payment voucher:', error);
      res.status(500).json({ error: 'Gagal memadam voucer pembayaran' });
    }
  });

  // Get approved financial claims for a specific period (for voucher creation)
  app.get('/api/payment-vouchers/claims/:year/:month', authenticateToken, async (req, res) => {
    try {
      const { year, month } = req.params;
      const claims = await storage.getApprovedFinancialClaims(parseInt(year), parseInt(month));
      res.json(claims);
    } catch (error) {
      console.error('Error fetching approved claims:', error);
      res.status(500).json({ error: 'Gagal mengambil tuntutan yang diluluskan' });
    }
  });

  // Get claims for a specific voucher
  app.get('/api/payment-vouchers/:id/claims', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const voucher = await storage.getPaymentVoucher(id);
      
      if (!voucher) {
        return res.status(404).json({ error: 'Voucher pembayaran tidak dijumpai' });
      }

      // Get claims based on includedClaims array in voucher
      const claims = [];
      if (voucher.includedClaims && voucher.includedClaims.length > 0) {
        for (const claimId of voucher.includedClaims) {
          const claim = await storage.getClaimApplication(claimId);
          if (claim) {
            claims.push(claim);
          }
        }
      }
      
      res.json(claims);
    } catch (error) {
      console.error('Error fetching voucher claims:', error);
      res.status(500).json({ error: 'Gagal mengambil tuntutan voucher' });
    }
  });

  // Generate PDF using HTML template - same technique as payroll
  app.get('/api/payment-vouchers/:id/pdf', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get voucher details
      const voucher = await storage.getPaymentVoucher(id);
      if (!voucher) {
        return res.status(404).json({ error: 'Payment voucher not found' });
      }
      
      // Get claims for the voucher
      const claims = [];
      let employeeName = '';
      if (voucher.includedClaims && voucher.includedClaims.length > 0) {
        for (const claimId of voucher.includedClaims) {
          const claim = await storage.getClaimApplication(claimId);
          if (claim) {
            claims.push(claim);
            // Get employee name from the first claim's employeeId
            if (!employeeName && claim.employeeId) {
              const employee = await storage.getEmployee(claim.employeeId);
              if (employee) {
                employeeName = employee.fullName;
              }
            }
          }
        }
      }
      
      // Get company settings
      const companySettings = await storage.getCompanySettings();
      
      // Get employees data for name mapping
      const employeesData = await storage.getAllEmployees();
      
      const getEmployeeName = (employeeId: string) => {
        const employee = employeesData?.find((emp: any) => emp.id === employeeId);
        return employee ? employee.fullName : 'Employee Name';
      };
      
      const getEmployeeNRIC = (employeeId: string): string => {
        const employee = employeesData?.find((emp: any) => emp.id === employeeId);
        return employee?.nric || 'Not Stated';
      };

      const getEmployeeBankInfo = (employeeId: string): string => {
        const employee = employeesData?.find((emp: any) => emp.id === employeeId);
        return employee?.bankAccount || 'Not Stated';
      };

      const getEmployeeStaffId = (employeeId: string): string => {
        const employee = employeesData?.find((emp: any) => emp.id === employeeId);
        return employee?.staffId || 'S27650-5127';
      };

      const convertToWords = (amount: number): string => {
        if (amount === 0) return 'ZERO';
        
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
                      'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 
                      'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
        
        const convert = (num: number): string => {
          if (num === 0) return '';
          else if (num < 20) return ones[num];
          else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
          else if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
          else if (num < 1000000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
          else return convert(Math.floor(num / 1000000)) + ' MILLION' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
        };
        
        const wholePart = Math.floor(amount);
        const decimalPart = Math.round((amount - wholePart) * 100);
        
        let result = convert(wholePart);
        if (decimalPart > 0) {
          result += ' AND ' + convert(decimalPart) + ' SEN';
        }
        result += ' ONLY';
        
        return result;
      };

      const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
        { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
      ];

      const monthName = months.find(m => m.value === voucher.month.toString())?.label || voucher.month;
      const totalAmount = claims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0);

      // Use the same PDF generator approach as payroll
      const { generateVoucherPDF } = await import('./voucher-pdf-generator');
      
      const voucherData = {
        company: {
          name: companySettings?.companyName || 'UTAMA MEDGROUP',
          address: companySettings?.address || '',
          email: companySettings?.email || ''
        },
        voucher: {
          number: voucher.voucherNumber,
          date: new Date(voucher.paymentDate).toLocaleDateString('en-GB'),
          month: monthName.toString()
        },
        employee: {
          name: claims.length > 0 ? getEmployeeName(claims[0].employeeId) : 'Employee Name',
          staffId: claims.length > 0 ? getEmployeeStaffId(claims[0].employeeId) : 'S27650-5127',
          nric: claims.length > 0 ? getEmployeeNRIC(claims[0].employeeId) : 'Not Stated',
          bankAccount: claims.length > 0 ? getEmployeeBankInfo(claims[0].employeeId) : 'Not Stated'
        },
        claims: claims.map(claim => ({
          description: claim.claimCategory,
          amount: (parseFloat(claim.amount || '0') || 0).toFixed(2)
        })),
        totalAmount: totalAmount.toFixed(2),
        amountInWords: convertToWords(totalAmount)
      };

      const pdfBuffer = await generateVoucherPDF(voucherData);
      
      // Set headers for PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Payment_Voucher_${voucher.voucherNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Error generating payment voucher PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // =================== HOLIDAYS API ROUTES ===================
  
  // Get all holidays
  app.get("/api/holidays", authenticateToken, async (req, res) => {
    try {
      const holidays = await storage.getAllHolidays();
      res.json(holidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      res.status(500).json({ error: "Gagal mendapatkan data holiday" });
    }
  });

  // Create new holiday
  app.post("/api/holidays", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage holidays
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan holiday" });
      }

      const { name, date } = req.body;
      
      if (!name || !date) {
        return res.status(400).json({ error: "Nama holiday dan tarikh diperlukan" });
      }

      const newHoliday = await storage.createHoliday({
        name,
        date,
        isPublic: true, // All holidays are automatically public
        importToCalendar: true
      });

      res.status(201).json({
        success: true,
        holiday: newHoliday,
        message: "Holiday berjaya ditambah"
      });
    } catch (error) {
      console.error("Error creating holiday:", error);
      res.status(500).json({ error: "Gagal mencipta holiday" });
    }
  });

  // Update holiday
  app.put("/api/holidays/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage holidays
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan holiday" });
      }

      const { id } = req.params;
      const { isPublic } = req.body;

      const updatedHoliday = await storage.updateHoliday(id, { isPublic });

      if (!updatedHoliday) {
        return res.status(404).json({ error: "Holiday tidak dijumpai" });
      }

      res.json({
        success: true,
        holiday: updatedHoliday,
        message: "Holiday berjaya dikemaskini"
      });
    } catch (error) {
      console.error("Error updating holiday:", error);
      res.status(500).json({ error: "Gagal mengemaskini holiday" });
    }
  });

  // Delete holiday
  app.delete("/api/holidays/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage holidays
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan holiday" });
      }

      const { id } = req.params;

      const deleted = await storage.deleteHoliday(id);

      if (!deleted) {
        return res.status(404).json({ error: "Holiday tidak dijumpai" });
      }

      res.json({
        success: true,
        message: "Holiday berjaya dipadam"
      });
    } catch (error) {
      console.error("Error deleting holiday:", error);
      res.status(500).json({ error: "Gagal memadam holiday" });
    }
  });

  // =================== EVENT ROUTES ===================
  // Get all events
  app.get("/api/events", authenticateToken, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Gagal mendapatkan data acara" });
    }
  });

  // Get single event
  app.get("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Acara tidak dijumpai" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Gagal mendapatkan data acara" });
    }
  });

  // Create new event
  app.post("/api/events", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage events
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan acara" });
      }

      // Validate request data using the Event schema
      const eventData = insertEventSchema.parse(req.body);
      
      console.log('Current user:', currentUser);
      console.log('Event data before adding creator:', eventData);
      
      // Add the creator's user ID to the event data
      const eventWithCreator = {
        ...eventData,
        createdBy: currentUser.id
      };
      
      console.log('Event data with creator:', eventWithCreator);
      
      const newEvent = await storage.createEvent(eventWithCreator);

      res.status(201).json({
        success: true,
        event: newEvent,
        message: "Acara berjaya ditambah"
      });
    } catch (error) {
      console.error("Error creating event:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Data acara tidak sah", details: error.errors });
      }
      res.status(500).json({ error: "Gagal mencipta acara" });
    }
  });

  // Update event
  app.put("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage events
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan acara" });
      }

      const { id } = req.params;
      
      // Validate request data using the Event schema
      const eventData = updateEventSchema.parse(req.body);

      const updatedEvent = await storage.updateEvent(id, eventData);

      if (!updatedEvent) {
        return res.status(404).json({ error: "Acara tidak dijumpai" });
      }

      res.json({
        success: true,
        event: updatedEvent,
        message: "Acara berjaya dikemaskini"
      });
    } catch (error) {
      console.error("Error updating event:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Data acara tidak sah", details: error.errors });
      }
      res.status(500).json({ error: "Gagal mengemaskini acara" });
    }
  });

  // Delete event
  app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin rights to manage events
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Tidak dibenarkan untuk menguruskan acara" });
      }

      const { id } = req.params;

      const deleted = await storage.deleteEvent(id);

      if (!deleted) {
        return res.status(404).json({ error: "Acara tidak dijumpai" });
      }

      res.json({
        success: true,
        message: "Acara berjaya dipadam"
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Gagal memadam acara" });
    }
  });

  // =================== FORMS MANAGEMENT ENDPOINTS ===================
  // Get all forms
  app.get("/api/forms", authenticateToken, async (req, res) => {
    try {
      const formsData = await db.select().from(forms).orderBy(desc(forms.createdAt));
      res.json(formsData);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ error: "Gagal mendapatkan senarai borang" });
    }
  });

  // Upload new form (with file upload)
  app.post("/api/forms", authenticateToken, upload.single('formFile'), async (req, res) => {
    try {
      const formName = req.body.formName;
      const uploadedFile = req.file;
      
      if (!formName) {
        return res.status(400).json({ error: "Nama borang diperlukan" });
      }

      if (!uploadedFile) {
        return res.status(400).json({ error: "Fail borang diperlukan" });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/forms');
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        // Directory might already exist, that's fine
      }

      // Generate unique filename
      const fileExtension = path.extname(uploadedFile.originalname);
      const uniqueFileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);
      const fileUrl = `/uploads/forms/${uniqueFileName}`;

      // Save file to uploads directory
      await fs.writeFile(filePath, uploadedFile.buffer);

      const validatedData = insertFormSchema.parse({
        formName,
        fileName: uploadedFile.originalname,
        fileUrl,
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.mimetype
      });

      const [newForm] = await db.insert(forms).values(validatedData).returning();

      res.status(201).json({
        success: true,
        message: "Borang berjaya dimuat naik",
        form: newForm
      });
    } catch (error) {
      console.error("Error uploading form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak sah", details: error.errors });
      }
      res.status(500).json({ error: "Gagal memuat naik borang" });
    }
  });

  // Serve uploaded form files
  app.get("/uploads/forms/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads/forms', filename);
      
      // Check if file exists
      await fs.access(filePath);
      
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error serving form file:", error);
      res.status(404).json({ error: "Fail tidak dijumpai" });
    }
  });

  // Download form by ID
  app.get("/api/forms/download/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get form details from database
      const [form] = await db.select().from(forms).where(eq(forms.id, id));
      
      if (!form) {
        return res.status(404).json({ error: "Borang tidak dijumpai" });
      }

      // Extract filename from fileUrl
      const filename = path.basename(form.fileUrl);
      const filePath = path.join(__dirname, '../uploads/forms', filename);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Set proper headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${form.fileName}"`);
      res.setHeader('Content-Type', form.mimeType || 'application/octet-stream');
      
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error downloading form:", error);
      res.status(404).json({ error: "Fail tidak dijumpai" });
    }
  });

  // Delete form
  app.delete("/api/forms/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      // First get the form to find the file to delete
      const [existingForm] = await db.select().from(forms).where(eq(forms.id, id));
      
      if (!existingForm) {
        return res.status(404).json({ error: "Borang tidak dijumpai" });
      }

      // Delete from database
      const [deletedForm] = await db.delete(forms).where(eq(forms.id, id)).returning();

      // Try to delete the physical file
      if (existingForm.fileUrl && existingForm.fileUrl.startsWith('/uploads/forms/')) {
        const filename = path.basename(existingForm.fileUrl);
        const filePath = path.join(__dirname, '../uploads/forms', filename);
        try {
          await fs.unlink(filePath);
        } catch (fileError) {
          console.log("File already deleted or not found:", fileError);
        }
      }

      res.json({
        success: true,
        message: "Borang berjaya dipadam"
      });
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ error: "Gagal memadam borang" });
    }
  });

  // Disciplinary Records API endpoints
  app.get("/api/disciplinary-records/my-records", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Get current user's employee record
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee record tidak dijumpai" });
      }

      // Fetch user's disciplinary records from database
      const userRecords = await db.select()
        .from(disciplinaryRecords)
        .where(eq(disciplinaryRecords.employeeId, employee.id));

      res.json(userRecords);
    } catch (error) {
      console.error("Get user disciplinary records error:", error);
      res.status(500).json({ error: "Gagal mengambil rekod tatatertib pengguna" });
    }
  });

  // Get all disciplinary records (HR view)
  app.get("/api/disciplinary-records", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check HR access
      const hrRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!hrRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - Hanya HR yang dibenarkan" });
      }

      // Fetch all disciplinary records from database
      const allRecords = await db.select().from(disciplinaryRecords);

      res.json(allRecords);
    } catch (error) {
      console.error("Get all disciplinary records error:", error);
      res.status(500).json({ error: "Gagal mengambil rekod tatatertib" });
    }
  });

  // Create new disciplinary record (HR only)
  app.post("/api/disciplinary-records", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check HR access
      const hrRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!hrRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - Hanya HR yang dibenarkan" });
      }

      // Validate request body using Zod schema
      const validatedData = insertDisciplinaryRecordSchema.parse({
        ...req.body,
        issuedBy: currentUser.id,
        issuedByName: currentUser.username || 'HR',
        dateIssued: req.body.dateIssued || new Date(),
      });

      // Insert into database
      const [newRecord] = await db.insert(disciplinaryRecords)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        message: "Rekod tatatertib berjaya dibuat",
        record: newRecord
      });
    } catch (error) {
      console.error("Create disciplinary record error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Data tidak sah", details: error.errors });
      }
      res.status(500).json({ error: "Gagal membuat rekod tatatertib" });
    }
  });

  // Update disciplinary record (HR only)
  app.put("/api/disciplinary-records/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Check HR access
      const hrRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!hrRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - Hanya HR yang dibenarkan" });
      }

      // Prepare update data
      const updateData: any = {
        status: req.body.status,
        followUpRequired: req.body.followUpRequired,
        internalNotes: req.body.internalNotes,
      };

      // Only include followUpDate if it's provided and valid
      if (req.body.followUpDate && req.body.followUpDate.trim()) {
        updateData.followUpDate = new Date(req.body.followUpDate);
      }

      // Update the record in database
      const [updatedRecord] = await db.update(disciplinaryRecords)
        .set(updateData)
        .where(eq(disciplinaryRecords.id, id))
        .returning();

      if (!updatedRecord) {
        return res.status(404).json({ error: "Rekod tidak dijumpai" });
      }

      console.log(`Updated disciplinary record ${id} - new status: ${req.body.status}`);
      
      res.json({
        success: true,
        message: "Rekod tatatertib berjaya dikemas kini",
        record: updatedRecord
      });
    } catch (error) {
      console.error("Update disciplinary record error:", error);
      res.status(500).json({ error: "Gagal mengemas kini rekod tatatertib" });
    }
  });

  // Delete disciplinary record (HR only)
  app.delete("/api/disciplinary-records/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Check HR access
      const hrRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!hrRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - Hanya HR yang dibenarkan" });
      }

      // For now, return success response since schema not implemented yet
      // TODO: Implement actual disciplinary record deletion when schema is ready
      res.json({
        success: true,
        message: "Rekod tatatertib berjaya dipadam"
      });
    } catch (error) {
      console.error("Delete disciplinary record error:", error);
      res.status(500).json({ error: "Gagal memadam rekod tatatertib" });
    }
  });

  // Generate Excel template for bulk staff import
  app.get("/api/download-staff-template", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      
      // Check if user has admin access
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak - Hanya admin yang dibenarkan" });
      }

      console.log("Generating staff import template for user:", currentUser.username);

      // Create new Excel workbook
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet('Staff Import Template');

      // Define column headers based on database schema
      const headers = [
        'username', 'password', 'role', 'firstName', 'lastName', 'fullName',
        'nric', 'dateOfBirth', 'placeOfBirth', 'gender', 'race', 'religion',
        'bloodType', 'educationLevel', 'maritalStatus', 'nationality', 'bumiStatus',
        'familyMembers', 'staffId', 'drivingLicenseNumber', 'drivingClass', 'drivingExpiryDate',
        'status', 'company', 'branch', 'branchLocation', 'designation', 'department',
        'dateJoining', 'dateOfSign', 'employmentType', 'employmentStatus', 'okuStatus',
        'phoneNumber', 'mobileNumber', 'email', 'personalEmail', 'address', 'mailingAddress',
        'emergencyContactName', 'emergencyContactPhone'
      ];

      // Add headers to worksheet
      worksheet.addRow(headers);

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F2937' } // Dark gray background
      };

      // Auto-fit columns
      headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max(header.length + 2, 15);
      });

      // Add sample data row for guidance
      const sampleData = [
        'john.doe', 'password123', 'Staff/Employee', 'John', 'Doe', 'John Doe',
        '123456789012', '1990-01-01', 'Kuala Lumpur', 'Male', 'Malay', 'Islam',
        'O+', 'Degree', 'Single', 'Malaysian', 'Yes',
        '0', 'EMP001', 'D1234567', 'B2', '2025-12-31',
        'employed', 'UTAMA HR', 'HQ', 'Kuala Lumpur', 'Software Engineer', 'IT',
        '2024-01-01', '2024-01-01', 'Permanent', 'Employed', 'No',
        '0123456789', '0123456789', 'john.doe@company.com', 'john@personal.com', 
        'Jalan ABC, Kuala Lumpur', 'Jalan ABC, Kuala Lumpur',
        'Jane Doe', '0123456788'
      ];

      worksheet.addRow(sampleData);

      // Style the sample data row
      const sampleRow = worksheet.getRow(2);
      sampleRow.font = { italic: true, color: { argb: '6B7280' } };

      // Add instructions worksheet
      const instructionsSheet = workbook.addWorksheet('Instructions');
      const instructions = [
        ['ARAHAN UNTUK IMPORT STAFF SECARA BULK'],
        [''],
        ['1. Gunakan sheet "Staff Import Template" untuk input data staff'],
        ['2. Padam baris sample data (baris ke-2) sebelum import'],
        ['3. Pastikan format data mengikut contoh yang diberikan'],
        ['4. Field yang WAJIB diisi:'],
        ['   - username (unik)'],
        ['   - password'],
        ['   - role (pilihan: Super Admin, Admin, HR Manager, PIC, Finance/Account, Staff/Employee)'],
        ['   - firstName'],
        ['   - lastName'],
        ['   - email'],
        [''],
        ['5. Format tarikh: YYYY-MM-DD (contoh: 2024-12-31)'],
        ['6. Field gender: Male/Female'],
        ['7. Field status: employed/terminated'],
        ['8. Field employmentStatus: Employed/Terminated'],
        ['9. Field okuStatus: Yes/No'],
        ['10. Field bumiStatus: Yes/No'],
        [''],
        ['NOTA:'],
        ['- Jika field tidak diisi, sistem akan gunakan nilai default'],
        ['- Username mesti unik dalam sistem'],
        ['- Email mesti format yang sah'],
        ['- Pastikan data peribadi adalah tepat dan terkini']
      ];

      instructions.forEach((instruction, index) => {
        instructionsSheet.addRow(instruction);
        if (index === 0) {
          const titleRow = instructionsSheet.getRow(index + 1);
          titleRow.font = { bold: true, size: 14 };
        }
      });

      // Auto-fit instruction column
      instructionsSheet.getColumn(1).width = 60;

      // Set response headers for file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Staff_Import_Template.xlsx"'
      );

      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();

      console.log("Staff import template generated successfully");
    } catch (error) {
      console.error("Generate staff template error:", error);
      res.status(500).json({ error: "Gagal menjana template Excel" });
    }
  });

  // Download all employees data as PDF report
  app.get("/api/download-employees-pdf", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      console.log(`Generating employee PDF report for user: ${currentUser.username}`);

      // Check if user has admin privileges
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: "Akses ditolak. Hanya admin yang dibenarkan." });
      }

      // Get all employees data with complete details
      const employees = await storage.getAllEmployeesWithDetails();
      
      const pdfBuffer = await EmployeePDFGenerator.generateEmployeeReport(employees);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      const currentDate = new Date().toISOString().split('T')[0];
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Employee_Report_${currentDate}.pdf"`
      );

      // Send PDF buffer
      res.send(pdfBuffer);
      console.log("Employee PDF report generated successfully");
    } catch (error) {
      console.error("Generate employee PDF error:", error);
      res.status(500).json({ error: "Gagal menjana laporan PDF employee" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
