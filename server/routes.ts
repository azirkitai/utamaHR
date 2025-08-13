import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateToken } from "./auth";
import { storage } from "./storage";
import { generatePayslipPDF } from './payslip-html-generator';
import { generatePayslipExcel } from './payslip-excel-generator';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
  insertPayrollDocumentSchema,
  updatePayrollDocumentSchema,
  insertPayrollItemSchema,
  updatePayrollItemSchema,
  insertCompanySettingSchema,
  updateCompanySettingSchema,
  type AttendanceRecord
} from "@shared/schema";
import { checkEnvironmentSecrets } from "./env-check";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
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
  financialClaimPolicies
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

      res.json(records);
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
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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
      
      // Role-based access control for new role system
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (adminRoles.includes(currentUser.role)) {
        // Admin roles can see all employees with details
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

  app.get("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ error: "Pekerja tidak dijumpai" });
      }
      
      // Role-based access control for individual employee access
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
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
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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
      
      // Only admin roles can update employment records
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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
      
      // If already clocked in today, check if clock out is needed
      if (todayAttendance && todayAttendance.clockInTime) {
        if (todayAttendance.clockOutTime) {
          // Already completed full cycle (clock in + clock out) for today
          return res.status(400).json({ 
            error: "Anda telah selesai clock-in dan clock-out untuk hari ini",
            alreadyCompleted: true
          });
        }
        // Has clock-in but no clock-out, so this should be clock-out
        // Process as clock-out
        console.log("Converting clock-in request to clock-out for user:", qrToken.userId);
        return await processClockOut(res, qrToken, todayAttendance, latitude, longitude, selfieImageUrl, storage);
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
      // Create attendance record for today with location tracking
      await storage.createOrUpdateAttendanceRecord({
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
        status: locationStatus === "valid" ? "present" : "invalid_location"
      });

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
      
      // Only admin roles can update employee profile images
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
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

  // =================== APPROVAL SETTINGS ROUTES ===================

  // POST /api/approval-settings - Save approval settings
  app.post("/api/approval-settings", authenticateToken, async (req, res) => {
    try {
      const { type, firstLevelApprovalId, secondLevelApprovalId } = req.body;
      
      // Check if approval setting already exists for this type
      const [existingSetting] = await db
        .select()
        .from(approvalSettings)
        .where(eq(approvalSettings.type, type));
      
      if (existingSetting) {
        // Update existing setting
        const [updatedSetting] = await db
          .update(approvalSettings)
          .set({
            firstLevelApprovalId: (firstLevelApprovalId === "none" || firstLevelApprovalId === "") ? null : firstLevelApprovalId,
            secondLevelApprovalId: (secondLevelApprovalId === "none" || secondLevelApprovalId === "") ? null : secondLevelApprovalId,
            updatedAt: sql`now()`,
          })
          .where(eq(approvalSettings.id, existingSetting.id))
          .returning();
        
        return res.json(updatedSetting);
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(approvalSettings)
          .values({
            type,
            firstLevelApprovalId: (firstLevelApprovalId === "none" || firstLevelApprovalId === "") ? null : firstLevelApprovalId,
            secondLevelApprovalId: (secondLevelApprovalId === "none" || secondLevelApprovalId === "") ? null : secondLevelApprovalId,
          })
          .returning();
        
        return res.json(newSetting);
      }
    } catch (error) {
      console.error("Error saving approval settings:", error);
      res.status(500).json({ error: "Failed to save approval settings" });
    }
  });

  // GET /api/approval-settings/:type - Get approval settings by type
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

  // Generate payroll items for a document
  app.post('/api/payroll/documents/:id/generate', authenticateToken, async (req, res) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      
      // Role-based access control
      const adminRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      if (!adminRoles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Tidak dibenarkan untuk menjana slip gaji' });
      }

      const items = await storage.generatePayrollItems(id);
      res.json({ 
        message: `${items.length} slip gaji berjaya dijana`,
        items: items.length 
      });
    } catch (error) {
      console.error('Error generating payroll items:', error);
      res.status(500).json({ error: 'Gagal menjana slip gaji pekerja' });
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

  // =================== COMPANY SETTINGS ROUTES ===================
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

  // Create company settings
  app.post("/api/company-settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCompanySettingSchema.parse(req.body);
      const settings = await storage.createCompanySettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating company settings:", error);
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
  app.post("/api/payroll/payslip/:employeeId/pdf", authenticateToken, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ error: "ID dokumen payroll diperlukan" });
      }

      // Get payroll document and item
      const document = await storage.getPayrollDocument(documentId);
      const payrollItem = await storage.getPayrollItemByDocumentAndEmployee(documentId, employeeId);
      const employee = await storage.getEmployee(employeeId);
      const employment = await storage.getEmploymentByEmployeeId(employeeId);
      const companySettings = await storage.getCompanySettings();

      if (!document || !payrollItem || !employee) {
        return res.status(404).json({ error: "Data payroll tidak dijumpai" });
      }

      // Parse payroll item data
      const employeeSnapshot = JSON.parse(payrollItem.employeeSnapshot);
      const salary = JSON.parse(payrollItem.salary);
      const deductions = JSON.parse(payrollItem.deductions);
      const contributions = JSON.parse(payrollItem.contributions);

      // Format monetary values with proper formatting
      const formatMoney = (value: any) => {
        const num = parseFloat(value || "0");
        return num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // Prepare template data following the exact format specification
      const templateData = {
        company: {
          name: companySettings?.companyName || "UTAMA MEDGROUP SDN BHD",
          regNo: companySettings?.companyRegistrationNumber || "202201033996(1479693-H)",
          address: companySettings?.address || "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 WILAYAH PERSEKUTUAN, KUALA LUMPUR"
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
            { label: "OVERTIME", amount: formatMoney(salary.overtime || 0), show: parseFloat(salary.overtime || "0") > 0 },
            { label: "CLAIMS", amount: formatMoney(salary.claims || 0), show: parseFloat(salary.claims || "0") > 0 }
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
        ytd: {
          employee: formatMoney(2783.00), // Should be calculated from YTD
          employer: formatMoney(3289.00), // Should be calculated from YTD
          mtd: formatMoney(payrollItem.netPay)
        }
      };

      // Generate PDF using HTML template approach with Puppeteer
      console.log('Generating PDF using HTML template method...');
      console.log('Template data:', JSON.stringify(templateData, null, 2));
      
      const pdfBuffer = await generatePayslipPDF(templateData);
      console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

      // Set headers for PDF download  
      const fileName = `Payslip_${employee.fullName?.replace(/\s+/g, '_')}_${getMonthName(document.month)}_${document.year}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Write buffer directly to response
      res.write(pdfBuffer);
      res.end();

    } catch (error) {
      console.error("Error generating payslip PDF:", error);
      res.status(500).json({ error: "Gagal menjana slip gaji PDF" });
    }
  });

  // Helper function for Excel generation
  function formatMoney(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
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
          address: companySettings?.address || "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 WILAYAH PERSEKUTUAN, KUALA LUMPUR",
          phone: companySettings?.phoneNumber,
          email: companySettings?.email || undefined,
          website: companySettings?.website || undefined
        },
        employee: {
          name: employeeSnapshot.name || employee.fullName || "",
          icNo: employeeSnapshot.nric || employee.nric || "",
          position: employeeSnapshot.position || ""
        },
        period: {
          month: getMonthName(document.month),
          year: document.year
        },
        income: {
          basic: formatMoney(salary.basic || 0),
          fixedAllowance: formatMoney(salary.fixedAllowance || 0),
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
        ytd: {
          employee: formatMoney(2783.00), // Should be calculated from YTD
          employer: formatMoney(3289.00), // Should be calculated from YTD
          mtd: formatMoney(payrollItem.netPay)
        }
      };

      // Generate Excel using template approach
      console.log('Generating Excel using template method...');
      console.log('Template data:', JSON.stringify(templateData, null, 2));
      
      const { excelPath, pdfPath } = await generatePayslipExcel(templateData);
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

  const httpServer = createServer(app);
  return httpServer;
}
