import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple user table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee table for HR management with complete details
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Personal Details
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nric: text("nric").unique(),
  nricOld: text("nric_old"),
  placeOfBirth: text("place_of_birth"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // Male, Female
  race: text("race"),
  religion: text("religion"),
  bloodType: text("blood_type"),
  educationLevel: text("education_level"),
  maritalStatus: text("marital_status"),
  nationality: text("nationality"),
  bumiStatus: text("bumi_status"),
  familyMembers: text("family_members"),
  
  // Contact Info
  email: text("email").notNull().unique(),
  phone: text("phone"),
  currentAddress: text("current_address"),
  permanentAddress: text("permanent_address"),
  
  // Employment Info
  employeeId: text("employee_id").unique(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  joinDate: timestamp("join_date").defaultNow().notNull(),
  employmentStatus: text("employment_status").notNull().default("active"), // Permanent, Contract, Probation, etc.
  salary: text("salary"), // Store as text for simplicity
  
  // Driving License Details
  drivingLicenseNumber: text("driving_license_number"),
  drivingClass: text("driving_class"),
  drivingExpiryDate: timestamp("driving_expiry_date"),
  
  // System fields
  status: text("status").notNull().default("active"), // active, inactive, terminated
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work Experience table
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

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmployeeSchema = insertEmployeeSchema.partial();

export const insertWorkExperienceSchema = createInsertSchema(workExperiences).omit({
  id: true,
  createdAt: true,
});

export const updateWorkExperienceSchema = insertWorkExperienceSchema.partial();

export const loginSchema = z.object({
  username: z.string().min(1, "Username diperlukan"),
  password: z.string().min(1, "Password diperlukan"),
});

export const insertQrTokenSchema = createInsertSchema(qrTokens).omit({
  id: true,
  createdAt: true,
});

export const insertOfficeLocationSchema = createInsertSchema(officeLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOfficeLocationSchema = insertOfficeLocationSchema.partial();

export const insertClockInSchema = createInsertSchema(clockInRecords).omit({
  id: true,
  createdAt: true,
  clockInTime: true,
});

export const mobileClockInSchema = z.object({
  token: z.string().min(1, "Token diperlukan"),
  latitude: z.string().min(1, "Lokasi diperlukan"),
  longitude: z.string().min(1, "Lokasi diperlukan"),
  selfieImageUrl: z.string().min(1, "Selfie diperlukan"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type QrToken = typeof qrTokens.$inferSelect;
export type InsertQrToken = z.infer<typeof insertQrTokenSchema>;
export type OfficeLocation = typeof officeLocations.$inferSelect;
export type InsertOfficeLocation = z.infer<typeof insertOfficeLocationSchema>;
export type UpdateOfficeLocation = z.infer<typeof updateOfficeLocationSchema>;
export type ClockInRecord = typeof clockInRecords.$inferSelect;
export type InsertClockIn = z.infer<typeof insertClockInSchema>;
export type MobileClockInData = z.infer<typeof mobileClockInSchema>;
export type WorkExperience = typeof workExperiences.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperienceSchema>;
