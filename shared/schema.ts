import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
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
  entitlement: decimal("entitlement", { precision: 5, scale: 2 }),
  balance: decimal("balance", { precision: 5, scale: 2 }),
  remarks: text("remarks"),
  
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

// =================== VALIDATION SCHEMAS ===================

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
});
export const updateEmployeeSchema = insertEmployeeSchema.partial();

// Employment schemas
export const insertEmploymentSchema = createInsertSchema(employment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
});
export const updateWorkExperienceSchema = insertWorkExperienceSchema.partial();

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

// App Setting types
export type AppSetting = typeof appSetting.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type UpdateAppSetting = z.infer<typeof updateAppSettingSchema>;

// Work Experience types
export type WorkExperience = typeof workExperiences.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperienceSchema>;

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
