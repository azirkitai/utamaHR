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

// Employee table for HR management
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  salary: text("salary"), // Store as text for simplicity
  joinDate: timestamp("join_date").defaultNow().notNull(),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
