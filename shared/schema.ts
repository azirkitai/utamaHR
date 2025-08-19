import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 1. User Table (for login credentials)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // admin, hr, employee, manager
  email: text("email"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Employee Table (main employee record linked to user)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MUST link to user
  
  // Personal Details (Personal Detail tab)
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  nric: text("nric").unique(),
  nricOld: text("nric_old"),
  dateOfBirth: timestamp("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  gender: text("gender"), // Male, Female
  race: text("race"),
  religion: text("religion"),
  bloodType: text("blood_type"),
  educationLevel: text("education_level"),
  maritalStatus: text("marital_status"),
  nationality: text("nationality"),
  bumiStatus: text("bumi_status"),
  familyMembers: integer("family_members").default(0),
  
  // Staff ID and Role field (only visible to authorized roles)
  staffId: text("staff_id"), // Employee staff/employee ID
  role: text("role").default("Staff/Employee"), // Super Admin, Admin, HR Manager, PIC, Finance/Account, Manager/Supervisor, Staff/Employee
  
  // Driving License Details
  drivingLicenseNumber: text("driving_license_number"),
  drivingClass: text("driving_class"),
  drivingExpiryDate: timestamp("driving_expiry_date"),
  
  // System fields
  status: text("status").notNull().default("employed"), // employed, terminated, retired
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Employment Table (Employment tab)
export const employment = pgTable("employment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  employeeNo: text("employee_no").unique(),
  company: text("company"),
  branch: text("branch"),
  branchLocation: text("branch_location"),
  designation: text("designation"),
  department: text("department"),
  dateJoining: timestamp("date_joining"),
  dateOfSign: timestamp("date_of_sign"),
  employmentType: text("employment_type"), // Permanent, Contract, Probation
  employmentStatus: text("employment_status").default("Employed"),
  okuStatus: text("oku_status").default("No"),
  
  // Approval Details
  leaveFirstApproval: text("leave_first_approval"),
  leaveSecondApproval: text("leave_second_approval"),
  claimFirstApproval: text("claim_first_approval"),
  claimSecondApproval: text("claim_second_approval"),
  overtimeFirstApproval: text("overtime_first_approval"),
  overtimeSecondApproval: text("overtime_second_approval"),
  timeoffFirstApproval: text("timeoff_first_approval"),
  timeoffSecondApproval: text("timeoff_second_approval"),
  
  // Yearly Form
  eaPersonInCharge: text("ea_person_in_charge"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company Access Table (for Yearly Form card)
export const companyAccess = pgTable("company_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  companyName: text("company_name").notNull(),
  hasAccess: boolean("has_access").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Contact Table (Contact tab)
export const contact = pgTable("contact", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  phoneNumber: text("phone_number"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  personalEmail: text("personal_email"),
  address: text("address"),
  mailingAddress: text("mailing_address"),
  
  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Family Details Table (Family Detail tab)
export const familyDetails = pgTable("family_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  relation: text("relation"), // Spouse, Child, Parent, etc.
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  nricPassport: text("nric_passport"),
  dateOfBirth: timestamp("date_of_birth"),
  phoneNo: text("phone_no"),
  email: text("email"),
  address: text("address"),
  employmentStatus: text("employment_status"),
  okuStatus: text("oku_status"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Compensation Table (Compensation tab)
export const compensation = pgTable("compensation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  // Bank Details
  bank: text("bank"),
  accountNumber: text("account_number"),
  accountType: text("account_type"),
  branch: text("branch"),
  accountStatus: text("account_status"),
  
  // Statutory Details
  epfNumber: text("epf_number"),
  epfContributionStartDate: timestamp("epf_contribution_start_date"),
  socsoNumber: text("socso_number"),
  socsoContributionStartAge: text("socso_contribution_start_age"),
  socsoCategory: text("socso_category"),
  eisContributionRate: text("eis_contribution_rate").default("Employee 0.2%  Employer 0.2%"),
  
  // Income Tax
  incomeTaxNumber: text("income_tax_number"),
  volaValue: decimal("vola_value", { precision: 10, scale: 2 }).default(sql`0`),
  
  // Children & Spouse Information
  employeeHasChild: boolean("employee_has_child").default(false),
  spouseIsWorking: boolean("spouse_is_working").default(false),
  spouseIsDisable: boolean("spouse_is_disable").default(false),
  spouseGender: text("spouse_gender"),
  
  // Employee Category
  employeeCategory: text("employee_category").default("None"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Document Table (Document tab)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  name: text("name").notNull(),
  remarks: text("remarks"),
  fileUrl: text("file_url"), // Object storage path
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Forms Management Table (System Settings Forms)
export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  formName: text("form_name").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage path
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"), // File MIME type
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 8. Equipment Table (Equipment tab)
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  equipmentName: text("equipment_name").notNull(),
  serialNumber: text("serial_number"),
  dateReceived: timestamp("date_received"),
  dateReturned: timestamp("date_returned"),
  remarks: text("remarks"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Leave Policy Table (Leave Policy tab)
export const leavePolicy = pgTable("leave_policy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  leaveType: text("leave_type"), // Annual Leave, Sick Leave, etc.
  entitlement: integer("entitlement"), // How many days entitled
  balance: integer("balance"), // Remaining balance
  remarks: text("remarks"),
  included: boolean("included").default(false), // Whether this policy is included/enabled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leave Applications Table 
export const leaveApplications = pgTable("leave_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  applicant: text("applicant").notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startDayType: text("start_day_type").notNull().default("Full Day"), // Full Day or Half Day
  endDayType: text("end_day_type").notNull().default("Full Day"),
  totalDays: decimal("total_days", { precision: 4, scale: 1 }).notNull(),
  reason: text("reason").notNull(),
  supportingDocument: text("supporting_document"), // file path/name
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
  appliedDate: timestamp("applied_date").defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id), // user ID who approved/rejected
  reviewedDate: timestamp("reviewed_date"),
  reviewComments: text("review_comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. Claim Policy Table (Claim Policy tab)
export const claimPolicy = pgTable("claim_policy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  claimType: text("claim_type"), // Flight Tix, Parking, Meal, Hotel, etc.
  annualLimit: decimal("annual_limit", { precision: 10, scale: 2 }),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  isEnabled: boolean("is_enabled").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 11. Disciplinary Table (Disciplinary tab)
export const disciplinary = pgTable("disciplinary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  incidentDate: timestamp("incident_date"),
  type: text("type"), // Warning, Suspension, etc.
  remarks: text("remarks"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company Settings Table (for system-wide company configuration)
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Company Information
  companyName: text("company_name").notNull(),
  companyShortName: text("company_short_name"),
  companyRegistrationNumber: text("company_registration_number"),
  companyType: text("company_type"),
  industry: text("industry"),
  
  // Contact Information
  email: text("email"),
  phoneNumber: text("phone_number"),
  faxNumber: text("fax_number"),
  website: text("website"),
  
  // Address Information
  address: text("address"),
  city: text("city"),
  postcode: text("postcode"),
  state: text("state"),
  country: text("country"),
  
  // Logo and Branding
  logoUrl: text("logo_url"),
  
  // Payment & Currency Settings  
  currency: text("currency").default("RM"),
  epfEnabled: boolean("epf_enabled").default(true),
  socsoEnabled: boolean("socso_enabled").default(true),
  eisEnabled: boolean("eis_enabled").default(true),
  hrdfEnabled: boolean("hrdf_enabled").default(true),
  pcb39Enabled: boolean("pcb39_enabled").default(true),
  standardWorkingHour: text("standard_working_hour").default("8"),
  
  // Bank & Account Details
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  epfNumber: text("epf_number"),
  socsoNumber: text("socso_number"),
  incomeTaxNumber: text("income_tax_number"),
  employerNumber: text("employer_number"),
  lhdnBranch: text("lhdn_branch"),
  originatorId: text("originator_id"),
  zakatNumber: text("zakat_number"),
  cNumber: text("c_number"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 12. App Setting Table (App Setting tab)
export const appSetting = pgTable("app_setting", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  // Approval Details
  leaveFirstApproval: text("leave_first_approval"),
  leaveSecondApproval: text("leave_second_approval"),
  claimFirstApproval: text("claim_first_approval"),
  claimSecondApproval: text("claim_second_approval"),
  overtimeFirstApproval: text("overtime_first_approval"),
  overtimeSecondApproval: text("overtime_second_approval"),
  timeoffFirstApproval: text("timeoff_first_approval"),
  timeoffSecondApproval: text("timeoff_second_approval"),
  
  // Yearly Form
  eaPersonInCharge: text("ea_person_in_charge"),
  
  // Company Access
  companyAccess: text("company_access"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 13. Work Experience Table (for employment history)
export const workExperiences = pgTable("work_experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  
  previousCompany: text("previous_company").notNull(),
  position: text("position").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  period: text("period"), // Duration in months/years
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// QR Code tokens for clock-in
export const qrTokens = pgTable("qr_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  isUsed: text("is_used").notNull().default("false"), // Store as text: "false", "true"
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Office locations for clock-in validation
export const officeLocations = pgTable("office_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  radius: text("radius").notNull().default("50"), // in meters
  isActive: text("is_active").notNull().default("true"), // Store as text: "true", "false"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shifts table for storing work shift configurations
export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Shift name (e.g., "Morning Shift", "Night Shift")
  description: text("description"), // Optional description
  clockIn: text("clock_in").notNull(), // Start time (e.g., "08:30")
  clockOut: text("clock_out").notNull(), // End time (e.g., "17:30")
  color: text("color").notNull().default("#3B82F6"), // Color code for visual identification
  breakTimeOut: text("break_time_out").default("none"), // Break start time or "none"
  breakTimeIn: text("break_time_in").default("none"), // Break end time or "none"
  // Workdays configuration as JSON string
  workdays: text("workdays").default('{"Sunday":"Off Day","Monday":"Full Day","Tuesday":"Full Day","Wednesday":"Full Day","Thursday":"Full Day","Friday":"Full Day","Saturday":"Half Day"}'),
  // Shift compliance settings
  enableStrictClockIn: boolean("enable_strict_clock_in").default(false), // Flag late entries for review
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clock-in records
export const clockInRecords = pgTable("clock_in_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  clockInTime: timestamp("clock_in_time").defaultNow().notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  selfieImagePath: text("selfie_image_path"), // Path to selfie in object storage
  locationStatus: text("location_status").notNull().default("valid"), // valid, invalid
  distance: text("distance"), // distance from office in meters
  officeLocationId: varchar("office_location_id").references(() => officeLocations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance records for My Record page
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(), // Work date
  clockInTime: timestamp("clock_in_time"),
  clockOutTime: timestamp("clock_out_time"),
  clockInImage: text("clock_in_image"), // Image path for clock in
  clockOutImage: text("clock_out_image"), // Image path for clock out
  
  // Break time tracking
  breakOutTime: timestamp("break_out_time"), // When employee starts break/lunch
  breakInTime: timestamp("break_in_time"), // When employee returns from break/lunch
  breakOutImage: text("break_out_image"), // Image for break start
  breakInImage: text("break_in_image"), // Image for break end
  
  // Location tracking for clock-in
  clockInLatitude: text("clock_in_latitude"), // GPS latitude for clock in
  clockInLongitude: text("clock_in_longitude"), // GPS longitude for clock in
  clockInLocationStatus: text("clock_in_location_status"), // valid, invalid
  clockInDistance: text("clock_in_distance"), // distance from office in meters
  clockInOfficeLocationId: varchar("clock_in_office_location_id").references(() => officeLocations.id),
  
  // Location tracking for break-out
  breakOutLatitude: text("break_out_latitude"),
  breakOutLongitude: text("break_out_longitude"),
  breakOutLocationStatus: text("break_out_location_status"),
  breakOutDistance: text("break_out_distance"),
  breakOutOfficeLocationId: varchar("break_out_office_location_id").references(() => officeLocations.id),
  
  // Location tracking for break-in
  breakInLatitude: text("break_in_latitude"),
  breakInLongitude: text("break_in_longitude"),
  breakInLocationStatus: text("break_in_location_status"),
  breakInDistance: text("break_in_distance"),
  breakInOfficeLocationId: varchar("break_in_office_location_id").references(() => officeLocations.id),
  
  // Location tracking for clock-out
  clockOutLatitude: text("clock_out_latitude"), // GPS latitude for clock out
  clockOutLongitude: text("clock_out_longitude"), // GPS longitude for clock out
  clockOutLocationStatus: text("clock_out_location_status"), // valid, invalid
  clockOutDistance: text("clock_out_distance"), // distance from office in meters
  clockOutOfficeLocationId: varchar("clock_out_office_location_id").references(() => officeLocations.id),
  
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }).default(sql`0`),
  totalBreakHours: decimal("total_break_hours", { precision: 4, scale: 2 }).default(sql`0`), // Track break duration
  notes: text("notes"), // Notes for the day
  status: text("status").default("present"), // present, absent, late, early_leave
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 16. Approval Settings Table (for storing system-wide approval configurations)
export const approvalSettings = pgTable("approval_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'leave', 'timeoff', 'financial', 'overtime', 'payment'
  firstLevelApprovalId: varchar("first_level_approval_id").references(() => employees.id),
  secondLevelApprovalId: varchar("second_level_approval_id").references(() => employees.id),
  enableApproval: boolean("enable_approval").default(true), // For payment approval settings
  approvalLevel: text("approval_level").default("First Level"), // 'First Level' or 'Second Level'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 17. Company Leave Types Table (for storing company-wide enabled leave types)
export const companyLeaveTypes = pgTable("company_leave_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaveType: text("leave_type").notNull().unique(), // The leave type name
  name: text("name"), // Leave type name (alias for leaveType for backward compatibility)
  enabled: boolean("enabled").default(true), // Whether this leave type is enabled for the company
  entitlementDays: integer("entitlement_days").default(0), // Default entitlement days
  description: text("description"), // Description of the leave type
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 18. Group Policy Settings Table (for storing role-based leave policy configurations)
export const groupPolicySettings = pgTable("group_policy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaveType: text("leave_type").notNull(), // The leave type this setting applies to
  role: text("role").notNull(), // Super Admin, Admin, HR Manager, PIC, Manager/Supervisor, Employee
  enabled: boolean("enabled").default(false), // Whether this role has access to this leave type
  entitlementDays: integer("entitlement_days").default(0), // Number of days entitled for this role
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 19. Leave Policy Settings Table (for storing detailed leave policy configurations)
export const leavePolicySettings = pgTable("leave_policy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaveType: text("leave_type").notNull().unique(), // The leave type this setting applies to
  uploadAttachment: boolean("upload_attachment").default(true), // Allow attachment upload
  requireReason: boolean("require_reason").default(false), // Require reason for leave
  carryForward: boolean("carry_forward").default(true), // Allow carry forward
  proRated: boolean("pro_rated").default(true), // Enable pro-rated calculation
  roundingMethod: text("rounding_method").default("round-up"), // round-up, round-down
  minimumUnit: text("minimum_unit").default("1-day"), // 1-day, half-day
  dayLimit: integer("day_limit").default(5), // Days before application limit
  leaveRemark: text("leave_remark").default("Leave Remarks"), // Default leave remark
  excludedEmployees: text("excluded_employees").array().default(sql`'{}'`), // Array of excluded employee IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcements table
export const announcements = pgTable('announcements', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  department: varchar('department', { length: 100 }),
  targetEmployees: text('target_employees').array().notNull(), // Array of employee IDs
  attachment: varchar('attachment', { length: 255 }),
  announcerId: varchar('announcer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  announcerName: varchar('announcer_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Track which users have read which announcements
export const announcementReads = pgTable('announcement_reads', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at').defaultNow().notNull(),
});

// User-Announcement junction table to track read status
export const userAnnouncements = pgTable('user_announcements', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  announcementId: varchar('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Leave Balance Carry Forward Table
export const leaveBalanceCarryForward = pgTable('leave_balance_carry_forward', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveType: text('leave_type').notNull(),
  year: integer('year').notNull(), // Year from which balance is carried forward
  entitlementDays: decimal('entitlement_days', { precision: 4, scale: 1 }).notNull().default(sql`0`), // Original entitlement for the year
  usedDays: decimal('used_days', { precision: 4, scale: 1 }).notNull().default(sql`0`), // Days used in the year
  remainingDays: decimal('remaining_days', { precision: 4, scale: 1 }).notNull().default(sql`0`), // Days remaining at year end
  carriedForwardDays: decimal('carried_forward_days', { precision: 4, scale: 1 }).notNull().default(sql`0`), // Days carried to next year
  expiryDate: timestamp('expiry_date'), // When carry forward expires (optional)
  status: text('status').notNull().default('active'), // active, expired, used
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Financial Claim Policies Table
export const financialClaimPolicies = pgTable('financial_claim_policies', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  claimName: text('claim_name').notNull(),
  annualLimit: decimal('annual_limit', { precision: 10, scale: 2 }),
  annualLimitUnlimited: boolean('annual_limit_unlimited').default(false),
  limitPerApplication: decimal('limit_per_application', { precision: 10, scale: 2 }),
  limitPerApplicationUnlimited: boolean('limit_per_application_unlimited').default(false),
  excludedEmployeeIds: text('excluded_employee_ids').array().default(sql`'{}'`),
  claimRemark: text('claim_remark'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Overtime Approval Settings Table
export const overtimeApprovalSettings = pgTable('overtime_approval_settings', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  firstLevel: varchar('first_level'), // Employee ID for first level approval
  secondLevel: varchar('second_level'), // Employee ID for second level approval or 'none'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Overtime Policies Table (Normal Rate, Rest Day Rate, Public Holiday Rate)
export const overtimePolicies = pgTable('overtime_policies', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  policyType: text('policy_type').notNull(), // 'normal', 'rest_day', 'public_holiday'
  policyName: text('policy_name').notNull(), // 'Normal Rate', 'Rest Day Rate', 'Public Holiday Rate'
  multiplier: decimal('multiplier', { precision: 3, scale: 1 }).notNull(), // 1.5, 2.0, 3.0
  description: text('description'), // Description of when this rate applies
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Overtime Settings Table
export const overtimeSettings = pgTable('overtime_settings', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  countOvertimeInPayroll: boolean('count_overtime_in_payroll').default(true),
  workingDaysPerMonth: integer('working_days_per_month').default(26),
  workingHoursPerDay: integer('working_hours_per_day').default(8),
  overtimeCalculation: text('overtime_calculation').default('basic-salary'), // 'basic-salary' or 'gross-salary'
  overtimeCutoffDate: integer('overtime_cutoff_date').default(31), // Day of month for cutoff
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Financial Settings Table
export const financialSettings = pgTable('financial_settings', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  cutoffDate: integer('cutoff_date').default(25).notNull(), // Day of month for claim submission cutoff
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll Document Table (dokumen bulanan - level syarikat)
export const payrollDocuments = pgTable('payroll_documents', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  payrollDate: timestamp('payroll_date').notNull(),
  remarks: text('remarks'),
  status: text('status').notNull().default('Preparing'), // 'Preparing', 'PendingApproval', 'Approved', 'Closed'
  
  // Step tracking
  steps: text('steps').notNull().default('{"step1":"Update&Review","step2":"Approval","step3":"Payment&Close"}'), // JSON
  
  // Include flags for what to calculate
  includeFlags: text('include_flags').notNull().default('{"includeClaims":true,"includeOvertime":true,"includeUnpaidLeave":true,"includeLateness":true}'), // JSON
  
  // Audit fields
  createdBy: varchar('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  approvedBy: text('approved_by'), // JSON array of approver IDs
  approvedAt: timestamp('approved_at'),
  rejectedBy: varchar('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one document per (year, month)
  uniqueYearMonth: unique('payroll_documents_year_month_unique').on(table.year, table.month),
}));

// Payroll Item Table (payslip individu - anak kepada PayrollDocument)
export const payrollItems = pgTable('payroll_items', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').notNull().references(() => payrollDocuments.id, { onDelete: 'cascade' }),
  employeeId: varchar('employee_id').notNull().references(() => employees.id),
  
  // Snapshot profil pekerja (tidak berubah walaupun master data berubah)
  employeeSnapshot: text('employee_snapshot').notNull(), // JSON: {name, position, nric, etc}
  
  // Master Salary Snapshot (captured at generation time for YTD calculations)
  masterSalarySnapshot: text('master_salary_snapshot'), // JSON: complete Master Salary data including YTD values
  
  // Salary components (snapshot from MasterSalary)
  salary: text('salary').notNull(), // JSON: {basic, computed, fixedAllowance, additional[], gross}
  
  // Overtime calculation for this month
  overtime: text('overtime').notNull().default('{"hours":0,"amount":0,"calcNote":""}'), // JSON: {hours, amount, calcNote}
  
  // Claims for this month (if included)
  claims: text('claims').notNull().default('[]'), // JSON array of claims
  
  // Unpaid leave calculation
  unpaidLeave: text('unpaid_leave').notNull().default('{"days":0,"amount":0}'), // JSON: {days, amount}
  
  // Lateness calculation
  lateness: text('lateness').notNull().default('{"minutes":0,"amount":0}'), // JSON: {minutes, amount}
  
  // Deductions
  deductions: text('deductions').notNull(), // JSON: {epfEmployee, socsoEmployee, eisEmployee, pcb38, pcb39, zakat, other[]}
  
  // Company contributions
  contributions: text('contributions').notNull(), // JSON: {epfEmployer, socsoEmployer, eisEmployer, hrdf, other[]}
  
  // Final calculations
  netPay: decimal('net_pay', { precision: 12, scale: 2 }).notNull(),
  
  // Status and lock
  status: text('status').notNull().default('Preparing'), // Inherits from document
  locked: boolean('locked').notNull().default(false), // true after Submit Payment
  
  // Audit trail
  audit: text('audit').notNull(), // JSON: {generatedAt, generatedBy, recalcAt[]}
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one payroll item per employee per document
  uniqueDocumentEmployee: unique('payroll_items_document_employee_unique').on(table.documentId, table.employeeId),
}));

// User Payroll Records Table (records for individual users in My Record page)
export const userPayrollRecords = pgTable('user_payroll_records', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id),
  employeeId: varchar('employee_id').notNull().references(() => employees.id),
  
  // Payroll period
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  payrollDate: timestamp('payroll_date').notNull(),
  
  // Status tracking
  status: text('status').notNull().default('sent'), // sent, completed, cancelled
  remarks: text('remarks'),
  
  // Reference to original payroll document and item
  documentId: varchar('document_id').references(() => payrollDocuments.id),
  payrollItemId: varchar('payroll_item_id').references(() => payrollItems.id),
  
  // Submitted info
  submittedBy: varchar('submitted_by').notNull().references(() => users.id),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one record per user per year/month
  uniqueUserYearMonth: unique('user_payroll_records_user_year_month_unique').on(table.userId, table.year, table.month),
}));

// Claim Applications Table (for Financial and Overtime claims)
export const claimApplications = pgTable('claim_applications', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  claimType: text('claim_type').notNull(), // 'financial' or 'overtime'
  claimCategory: text('claim_category').notNull(), // For financial: policy name, for overtime: 'overtime'
  claimDate: timestamp('claim_date').notNull(),
  dateSubmitted: timestamp('date_submitted').defaultNow().notNull(), // When application was submitted
  amount: decimal('amount', { precision: 10, scale: 2 }), // For financial claims
  particulars: text('particulars'), // Description/details
  remark: text('remark'), // Additional notes
  supportingDocuments: text('supporting_documents').array().default(sql`'{}'`), // File paths/URLs
  
  // Financial claim specific fields
  financialPolicyName: text('financial_policy_name'), // Name of the financial policy applied
  
  // Overtime specific fields
  startTime: text('start_time'), // HH:MM format
  endTime: text('end_time'), // HH:MM format
  totalHours: decimal('total_hours', { precision: 4, scale: 2 }), // Calculated hours
  reason: text('reason'), // Reason for overtime
  additionalDescription: text('additional_description'), // Extra overtime details
  overtimePolicyType: text('overtime_policy_type'), // 'normal', 'rest_day', 'public_holiday'
  calculatedAmount: decimal('calculated_amount', { precision: 10, scale: 2 }), // Auto-calculated OT pay
  
  status: text('status').notNull().default('Pending'), // 'Pending', 'First Level Approved', 'Approved', 'Rejected'
  firstLevelApproverId: varchar('first_level_approver_id').references(() => employees.id), // First level approver
  secondLevelApproverId: varchar('second_level_approver_id').references(() => employees.id), // Second level approver
  approvedBy: varchar('approved_by').references(() => employees.id), // Who approved (final approver)
  approvedAt: timestamp('approved_at'),
  rejectedBy: varchar('rejected_by').references(() => employees.id), // Who rejected
  rejectedAt: timestamp('rejected_at'),
  dateRejected: timestamp('date_rejected'), // When it was rejected
  rejectionReason: text('rejection_reason'), // Why rejected
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Vouchers Table
export const paymentVouchers = pgTable('payment_vouchers', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  voucherNumber: text('voucher_number').notNull().unique(), // PV001UMG, PV002UMG, etc
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  paymentDate: timestamp('payment_date').notNull(),
  remarks: text('remarks'),
  status: text('status').notNull().default('Generated'), // 'Generated', 'Processing', 'Paid'
  
  // Claims included in this voucher (JSON array of claim IDs)
  includedClaims: text('included_claims').array().default(sql`'{}'`), // Claim application IDs
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  
  // CRITICAL: Requestor name for grouping vouchers by person (NOT by claim type)
  requestorName: text('requestor_name').notNull().default('Unknown'), // Employee name for voucher grouping
  
  // Audit fields
  createdBy: varchar('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company Holidays Table
export const holidays = pgTable('holidays', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  date: text('date').notNull(), // Date in DD-MM-YYYY format
  isPublic: boolean('is_public').notNull().default(true),
  importToCalendar: boolean('import_to_calendar').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company Events Table
export const events = pgTable('events', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description'),
  startDate: text('start_date').notNull(), // Date in YYYY-MM-DD format
  endDate: text('end_date'), // Optional end date in YYYY-MM-DD format
  time: text('time'), // Time in HH:MM format
  selectedEmployee: text('selected_employee'), // Empty string for everyone, or specific employee name
  createdBy: varchar('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =================== VALIDATION SCHEMAS ===================

// Attendance record schemas
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
  clockInTime: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
  clockOutTime: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
});
export const updateAttendanceRecordSchema = insertAttendanceRecordSchema.partial();

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
});

// Employee schemas  
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  dateOfBirth: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
  drivingExpiryDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
});
export const updateEmployeeSchema = insertEmployeeSchema.partial();

// Announcement schemas
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type SelectAnnouncement = typeof announcements.$inferSelect;

export const insertUserAnnouncementSchema = createInsertSchema(userAnnouncements).omit({
  id: true,
  createdAt: true,
});
export type InsertUserAnnouncement = z.infer<typeof insertUserAnnouncementSchema>;
export type SelectUserAnnouncement = typeof userAnnouncements.$inferSelect;

// Employment schemas
export const insertEmploymentSchema = createInsertSchema(employment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  dateJoining: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
  dateOfSign: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
});
export const updateEmploymentSchema = insertEmploymentSchema.partial();

// Contact schemas
export const insertContactSchema = createInsertSchema(contact).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateContactSchema = insertContactSchema.partial();

// Family Details schemas
export const insertFamilyDetailsSchema = createInsertSchema(familyDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  dateOfBirth: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
});
export const updateFamilyDetailsSchema = insertFamilyDetailsSchema.partial();

// Compensation schemas
export const insertCompensationSchema = createInsertSchema(compensation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateCompensationSchema = insertCompensationSchema.partial();

// Document schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateDocumentSchema = insertDocumentSchema.partial();

// Forms schemas
export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFormSchema = insertFormSchema.partial();

// Equipment schemas
export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateEquipmentSchema = insertEquipmentSchema.partial();

// Leave Policy schemas
export const insertLeavePolicySchema = createInsertSchema(leavePolicy).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateLeavePolicySchema = insertLeavePolicySchema.partial();

// Claim Policy schemas
export const insertClaimPolicySchema = createInsertSchema(claimPolicy).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateClaimPolicySchema = insertClaimPolicySchema.partial();

// Disciplinary schemas
export const insertDisciplinarySchema = createInsertSchema(disciplinary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateDisciplinarySchema = insertDisciplinarySchema.partial();

// Company Settings schemas
export const insertCompanySettingSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateCompanySettingSchema = insertCompanySettingSchema.partial();

// App Setting schemas
export const insertAppSettingSchema = createInsertSchema(appSetting).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateAppSettingSchema = insertAppSettingSchema.partial();

// Work Experience schemas
export const insertWorkExperienceSchema = createInsertSchema(workExperiences).omit({
  id: true,
  createdAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  startDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
  endDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date().nullable().optional()
  ),
});
export const updateWorkExperienceSchema = insertWorkExperienceSchema.partial();

// Leave Application schemas
export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  appliedDate: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  startDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date()
  ),
  endDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : null,
    z.date()
  ),
  // Handle totalDays to accept both number and string
  totalDays: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val.toString();
      return val;
    },
    z.string()
  ),
});
export const updateLeaveApplicationSchema = insertLeaveApplicationSchema.partial();

// QR Token schemas
export const insertQrTokenSchema = createInsertSchema(qrTokens).omit({
  id: true,
  createdAt: true,
});

// Office Location schemas
export const insertOfficeLocationSchema = createInsertSchema(officeLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateOfficeLocationSchema = insertOfficeLocationSchema.partial();

// Shifts schemas
export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateShiftSchema = insertShiftSchema.partial();
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type SelectShift = typeof shifts.$inferSelect;

// Approval Settings schemas
export const insertApprovalSettingSchema = createInsertSchema(approvalSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateApprovalSettingSchema = insertApprovalSettingSchema.partial();

// Company Leave Types schemas
export const insertCompanyLeaveTypeSchema = createInsertSchema(companyLeaveTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateCompanyLeaveTypeSchema = insertCompanyLeaveTypeSchema.partial();

// Group Policy Settings schemas
export const insertGroupPolicySettingSchema = createInsertSchema(groupPolicySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateGroupPolicySettingSchema = insertGroupPolicySettingSchema.partial();

// Clock-in schemas
export const insertClockInSchema = createInsertSchema(clockInRecords).omit({
  id: true,
  createdAt: true,
  clockInTime: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username diperlukan"),
  password: z.string().min(1, "Password diperlukan"),
});

// Mobile Clock-in schema
export const mobileClockInSchema = z.object({
  token: z.string().min(1, "Token diperlukan"),
  latitude: z.string().min(1, "Lokasi diperlukan"),
  longitude: z.string().min(1, "Lokasi diperlukan"),
  selfieImageUrl: z.string().min(1, "Selfie diperlukan"),
});

// Holidays schemas
export const insertHolidaySchema = createInsertSchema(holidays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateHolidaySchema = insertHolidaySchema.partial();
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type SelectHoliday = typeof holidays.$inferSelect;

// Financial Claim Policy schemas
export const insertFinancialClaimPolicySchema = createInsertSchema(financialClaimPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFinancialClaimPolicySchema = insertFinancialClaimPolicySchema.partial();

// Overtime Approval Settings schemas
export const insertOvertimeApprovalSettingSchema = createInsertSchema(overtimeApprovalSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateOvertimeApprovalSettingSchema = insertOvertimeApprovalSettingSchema.partial();

// Overtime Policy schemas
export const insertOvertimePolicySchema = createInsertSchema(overtimePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateOvertimePolicySchema = insertOvertimePolicySchema.partial();

// Overtime Settings schemas
export const insertOvertimeSettingSchema = createInsertSchema(overtimeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateOvertimeSettingSchema = insertOvertimeSettingSchema.partial();

// Financial Settings schemas
export const insertFinancialSettingsSchema = createInsertSchema(financialSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFinancialSettingsSchema = insertFinancialSettingsSchema.partial();

// Payroll Document schemas
export const insertPayrollDocumentSchema = createInsertSchema(payrollDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  payrollDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
});
export const updatePayrollDocumentSchema = insertPayrollDocumentSchema.partial();

// Payroll Item schemas
export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePayrollItemSchema = insertPayrollItemSchema.partial();

// User Payroll Records schemas
export const insertUserPayrollRecordSchema = createInsertSchema(userPayrollRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  payrollDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
});
export const updateUserPayrollRecordSchema = insertUserPayrollRecordSchema.partial();

// Claim Application schemas
export const insertClaimApplicationSchema = createInsertSchema(claimApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  claimDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
  dateSubmitted: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
});
export const updateClaimApplicationSchema = insertClaimApplicationSchema.partial();

// Payment Voucher schemas
export const insertPaymentVoucherSchema = createInsertSchema(paymentVouchers).omit({
  id: true,
  voucherNumber: true,  // Auto-generated by server
  createdBy: true,      // Set by server from authenticated user
  createdAt: true,
  updatedAt: true,
}).extend({
  // Handle date fields to accept strings and convert to Date objects
  paymentDate: z.preprocess(
    (val) => val ? new Date(val as string | Date) : new Date(),
    z.date()
  ),
});
export const updatePaymentVoucherSchema = insertPaymentVoucherSchema.partial();

// Event schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdBy: true, // Set by server from authenticated user
  createdAt: true,
  updatedAt: true,
});
export const updateEventSchema = insertEventSchema.partial();

// =================== TYPESCRIPT TYPES ===================

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Employee types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;

// Employment types
export type Employment = typeof employment.$inferSelect;
export type InsertEmployment = z.infer<typeof insertEmploymentSchema>;
export type UpdateEmployment = z.infer<typeof updateEmploymentSchema>;

// Contact types
export type Contact = typeof contact.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;

// Family Details types
export type FamilyDetails = typeof familyDetails.$inferSelect;
export type InsertFamilyDetails = z.infer<typeof insertFamilyDetailsSchema>;
export type UpdateFamilyDetails = z.infer<typeof updateFamilyDetailsSchema>;

// Compensation types
export type Compensation = typeof compensation.$inferSelect;
export type InsertCompensation = z.infer<typeof insertCompensationSchema>;
export type UpdateCompensation = z.infer<typeof updateCompensationSchema>;

// Document types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;

// Form types
export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type UpdateForm = z.infer<typeof updateFormSchema>;

// Equipment types
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;

// Leave Policy types
export type LeavePolicy = typeof leavePolicy.$inferSelect;
export type InsertLeavePolicy = z.infer<typeof insertLeavePolicySchema>;
export type UpdateLeavePolicy = z.infer<typeof updateLeavePolicySchema>;

// Claim Policy types
export type ClaimPolicy = typeof claimPolicy.$inferSelect;
export type InsertClaimPolicy = z.infer<typeof insertClaimPolicySchema>;
export type UpdateClaimPolicy = z.infer<typeof updateClaimPolicySchema>;

// Disciplinary types
export type Disciplinary = typeof disciplinary.$inferSelect;
export type InsertDisciplinary = z.infer<typeof insertDisciplinarySchema>;
export type UpdateDisciplinary = z.infer<typeof updateDisciplinarySchema>;

// Company Settings types
export type CompanySetting = typeof companySettings.$inferSelect;
export type InsertCompanySetting = z.infer<typeof insertCompanySettingSchema>;
export type UpdateCompanySetting = z.infer<typeof updateCompanySettingSchema>;

// App Setting types
export type AppSetting = typeof appSetting.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type UpdateAppSetting = z.infer<typeof updateAppSettingSchema>;

// Work Experience types
export type WorkExperience = typeof workExperiences.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;

// Leave Application types
export type LeaveApplication = typeof leaveApplications.$inferSelect;
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type UpdateLeaveApplication = z.infer<typeof updateLeaveApplicationSchema>;



// Financial Claim Policy types
export type FinancialClaimPolicy = typeof financialClaimPolicies.$inferSelect;
export type InsertFinancialClaimPolicy = z.infer<typeof insertFinancialClaimPolicySchema>;
export type UpdateFinancialClaimPolicy = z.infer<typeof updateFinancialClaimPolicySchema>;

// Overtime Approval Settings types
export type OvertimeApprovalSetting = typeof overtimeApprovalSettings.$inferSelect;
export type InsertOvertimeApprovalSetting = z.infer<typeof insertOvertimeApprovalSettingSchema>;
export type UpdateOvertimeApprovalSetting = z.infer<typeof updateOvertimeApprovalSettingSchema>;

// Overtime Policy types
export type OvertimePolicy = typeof overtimePolicies.$inferSelect;
export type InsertOvertimePolicy = z.infer<typeof insertOvertimePolicySchema>;
export type UpdateOvertimePolicy = z.infer<typeof updateOvertimePolicySchema>;

// Overtime Settings types
export type OvertimeSetting = typeof overtimeSettings.$inferSelect;
export type InsertOvertimeSetting = z.infer<typeof insertOvertimeSettingSchema>;
export type UpdateOvertimeSetting = z.infer<typeof updateOvertimeSettingSchema>;

// Financial Settings types
export type FinancialSetting = typeof financialSettings.$inferSelect;
export type InsertFinancialSetting = z.infer<typeof insertFinancialSettingsSchema>;
export type UpdateFinancialSetting = z.infer<typeof updateFinancialSettingsSchema>;

// Payroll Document types
export type PayrollDocument = typeof payrollDocuments.$inferSelect;
export type InsertPayrollDocument = z.infer<typeof insertPayrollDocumentSchema>;
export type UpdatePayrollDocument = z.infer<typeof updatePayrollDocumentSchema>;

// Payroll Item types
export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type UpdatePayrollItem = z.infer<typeof updatePayrollItemSchema>;

export type UserPayrollRecord = typeof userPayrollRecords.$inferSelect & {
  employeeName: string;
};
export type InsertUserPayrollRecord = z.infer<typeof insertUserPayrollRecordSchema>;
export type UpdateUserPayrollRecord = z.infer<typeof updateUserPayrollRecordSchema>;

// Claim Application types
export type ClaimApplication = typeof claimApplications.$inferSelect;
export type InsertClaimApplication = z.infer<typeof insertClaimApplicationSchema>;
export type UpdateClaimApplication = z.infer<typeof updateClaimApplicationSchema>;

// Payment Voucher types
export type PaymentVoucher = typeof paymentVouchers.$inferSelect;
export type InsertPaymentVoucher = z.infer<typeof insertPaymentVoucherSchema>;
export type UpdatePaymentVoucher = z.infer<typeof updatePaymentVoucherSchema>;

// Employee Documents table
export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  remarks: text("remarks"),
  fileUrl: varchar("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperienceSchema>;

// Company Access schemas
export const insertCompanyAccessSchema = createInsertSchema(companyAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateCompanyAccessSchema = insertCompanyAccessSchema.partial();

// Company Access types
export type CompanyAccess = typeof companyAccess.$inferSelect;
export type InsertCompanyAccess = z.infer<typeof insertCompanyAccessSchema>;
export type UpdateCompanyAccess = z.infer<typeof updateCompanyAccessSchema>;

// QR Token types
export type QrToken = typeof qrTokens.$inferSelect;
export type InsertQrToken = z.infer<typeof insertQrTokenSchema>;

// Office Location types
export type OfficeLocation = typeof officeLocations.$inferSelect;
export type InsertOfficeLocation = z.infer<typeof insertOfficeLocationSchema>;
export type UpdateOfficeLocation = z.infer<typeof updateOfficeLocationSchema>;

// Clock-in types
export type ClockInRecord = typeof clockInRecords.$inferSelect;
export type InsertClockIn = z.infer<typeof insertClockInSchema>;
export type MobileClockInData = z.infer<typeof mobileClockInSchema>;

// Attendance Record types  
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type UpdateAttendanceRecord = z.infer<typeof updateAttendanceRecordSchema>;

// Approval Settings types
export type ApprovalSetting = typeof approvalSettings.$inferSelect;
export type InsertApprovalSetting = z.infer<typeof insertApprovalSettingSchema>;
export type UpdateApprovalSetting = z.infer<typeof updateApprovalSettingSchema>;

// Company Leave Types types
export type CompanyLeaveType = typeof companyLeaveTypes.$inferSelect;
export type InsertCompanyLeaveType = z.infer<typeof insertCompanyLeaveTypeSchema>;
export type UpdateCompanyLeaveType = z.infer<typeof updateCompanyLeaveTypeSchema>;

// Group Policy Settings types
export type GroupPolicySetting = typeof groupPolicySettings.$inferSelect;
export type InsertGroupPolicySetting = z.infer<typeof insertGroupPolicySettingSchema>;
export type UpdateGroupPolicySetting = z.infer<typeof updateGroupPolicySettingSchema>;

// Leave Policy Settings schemas
export const insertLeavePolicySettingSchema = createInsertSchema(leavePolicySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateLeavePolicySettingSchema = insertLeavePolicySettingSchema.partial();

// Leave Policy Settings types
export type LeavePolicySetting = typeof leavePolicySettings.$inferSelect;
export type InsertLeavePolicySetting = z.infer<typeof insertLeavePolicySettingSchema>;

// Leave Balance Carry Forward schemas
export const insertLeaveBalanceCarryForwardSchema = createInsertSchema(leaveBalanceCarryForward).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateLeaveBalanceCarryForwardSchema = insertLeaveBalanceCarryForwardSchema.partial();

// Leave Balance Carry Forward types
export type LeaveBalanceCarryForward = typeof leaveBalanceCarryForward.$inferSelect;
export type InsertLeaveBalanceCarryForward = z.infer<typeof insertLeaveBalanceCarryForwardSchema>;
export type UpdateLeaveBalanceCarryForward = z.infer<typeof updateLeaveBalanceCarryForwardSchema>;
export type UpdateLeavePolicySetting = z.infer<typeof updateLeavePolicySettingSchema>;

// Employee Salary Management tables
export const employeeSalaries = pgTable("employee_salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Basic salary information
  salaryType: text("salary_type").default("Monthly"), // Monthly, Daily, Hourly
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).default("0.00"),
  
  // Additional items stored as JSON
  additionalItems: text("additional_items"), // JSON string of AdditionalItem[]
  
  // Deductions stored as JSON
  deductions: text("deductions"), // JSON string of deduction amounts and settings
  
  // Contributions stored as JSON
  contributions: text("contributions"), // JSON string of contribution amounts
  
  // Tax exemptions stored as JSON
  taxExemptions: text("tax_exemptions"), // JSON string of tax exemption items
  
  // Settings stored as JSON
  settings: text("settings"), // JSON string of salary calculation settings
  
  // Manual YTD values stored as JSON
  manualYtd: text("manual_ytd"), // JSON string of manual YTD values for employee and employer
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salaryBasicEarnings = pgTable("salary_basic_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salaryId: varchar("salary_id").notNull().references(() => employeeSalaries.id, { onDelete: "cascade" }),
  itemName: varchar("item_name").notNull(),
  itemType: varchar("item_type").notNull(), // "monthly", "daily", "hourly", "piece_rate", "percentage"
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salaryAdditionalItems = pgTable("salary_additional_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salaryId: varchar("salary_id").notNull().references(() => employeeSalaries.id, { onDelete: "cascade" }),
  itemName: varchar("item_name").notNull(),
  itemType: varchar("item_type").notNull(), // "monthly", "daily", "hourly", "piece_rate", "percentage"
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salaryDeductionItems = pgTable("salary_deduction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salaryId: varchar("salary_id").notNull().references(() => employeeSalaries.id, { onDelete: "cascade" }),
  itemName: varchar("item_name").notNull(),
  itemType: varchar("item_type").notNull(), // "monthly", "daily", "hourly", "piece_rate", "percentage"
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salaryCompanyContributions = pgTable("salary_company_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salaryId: varchar("salary_id").notNull().references(() => employeeSalaries.id, { onDelete: "cascade" }),
  itemName: varchar("item_name").notNull(),
  itemType: varchar("item_type").notNull(), // "monthly", "daily", "hourly", "piece_rate", "percentage"
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salary schemas
export const insertEmployeeSalarySchema = createInsertSchema(employeeSalaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  additionalItems: z.string().optional(),
  deductions: z.string().optional(),
  contributions: z.string().optional(),
  taxExemptions: z.string().optional(),
  settings: z.string().optional(),
  manualYtd: z.string().optional(),
});
export const updateEmployeeSalarySchema = insertEmployeeSalarySchema.partial();

export const insertSalaryBasicEarningSchema = createInsertSchema(salaryBasicEarnings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSalaryBasicEarningSchema = insertSalaryBasicEarningSchema.partial();

export const insertSalaryAdditionalItemSchema = createInsertSchema(salaryAdditionalItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSalaryAdditionalItemSchema = insertSalaryAdditionalItemSchema.partial();

export const insertSalaryDeductionItemSchema = createInsertSchema(salaryDeductionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSalaryDeductionItemSchema = insertSalaryDeductionItemSchema.partial();

export const insertSalaryCompanyContributionSchema = createInsertSchema(salaryCompanyContributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSalaryCompanyContributionSchema = insertSalaryCompanyContributionSchema.partial();

// Salary types
export type EmployeeSalary = typeof employeeSalaries.$inferSelect;
export type InsertEmployeeSalary = z.infer<typeof insertEmployeeSalarySchema>;
export type UpdateEmployeeSalary = z.infer<typeof updateEmployeeSalarySchema>;

export type SalaryBasicEarning = typeof salaryBasicEarnings.$inferSelect;
export type InsertSalaryBasicEarning = z.infer<typeof insertSalaryBasicEarningSchema>;
export type UpdateSalaryBasicEarning = z.infer<typeof updateSalaryBasicEarningSchema>;

export type SalaryAdditionalItem = typeof salaryAdditionalItems.$inferSelect;
export type InsertSalaryAdditionalItem = z.infer<typeof insertSalaryAdditionalItemSchema>;
export type UpdateSalaryAdditionalItem = z.infer<typeof updateSalaryAdditionalItemSchema>;

export type SalaryDeductionItem = typeof salaryDeductionItems.$inferSelect;
export type InsertSalaryDeductionItem = z.infer<typeof insertSalaryDeductionItemSchema>;
export type UpdateSalaryDeductionItem = z.infer<typeof updateSalaryDeductionItemSchema>;

export type SalaryCompanyContribution = typeof salaryCompanyContributions.$inferSelect;
export type InsertSalaryCompanyContribution = z.infer<typeof insertSalaryCompanyContributionSchema>;
export type UpdateSalaryCompanyContribution = z.infer<typeof updateSalaryCompanyContributionSchema>;

// Holiday types
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type UpdateHoliday = z.infer<typeof updateHolidaySchema>;

// Event types  
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;


