import { 
  type User, 
  type InsertUser, 
  type Employee, 
  type InsertEmployee, 
  type UpdateEmployee,
  type QrToken,
  type InsertQrToken,
  type OfficeLocation,
  type InsertOfficeLocation,
  type UpdateOfficeLocation,
  type ClockInRecord,
  type InsertClockIn,
  type WorkExperience,
  type InsertWorkExperience,
  type UpdateWorkExperience,
  users, 
  employees,
  qrTokens,
  officeLocations,
  clockInRecords,
  workExperiences
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // QR Token methods
  createQrToken(qrToken: InsertQrToken): Promise<QrToken>;
  getValidQrToken(token: string): Promise<QrToken | undefined>;
  markQrTokenAsUsed(token: string): Promise<void>;
  
  // Office location methods
  getAllOfficeLocations(): Promise<OfficeLocation[]>;
  getOfficeLocation(id: string): Promise<OfficeLocation | undefined>;
  createOfficeLocation(location: InsertOfficeLocation): Promise<OfficeLocation>;
  updateOfficeLocation(id: string, location: UpdateOfficeLocation): Promise<OfficeLocation | undefined>;
  deleteOfficeLocation(id: string): Promise<boolean>;
  getActiveOfficeLocations(): Promise<OfficeLocation[]>;
  
  // Clock-in methods
  createClockInRecord(clockIn: InsertClockIn): Promise<ClockInRecord>;
  getUserClockInRecords(userId: string): Promise<ClockInRecord[]>;
  
  // Work experience methods
  getWorkExperiences(employeeId: string): Promise<WorkExperience[]>;
  createWorkExperience(workExperience: InsertWorkExperience): Promise<WorkExperience>;
  updateWorkExperience(id: string, workExperience: UpdateWorkExperience): Promise<WorkExperience | undefined>;
  deleteWorkExperience(id: string): Promise<boolean>;
  
  // Employee password methods
  changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  resetEmployeePassword(employeeId: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    // Handle firstName and lastName splitting from name if not provided
    let firstName = insertEmployee.firstName;
    let lastName = insertEmployee.lastName;
    
    if (!firstName && !lastName && insertEmployee.name) {
      const nameParts = insertEmployee.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Ensure name is always provided
    const name = insertEmployee.name || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
    
    const [employee] = await db
      .insert(employees)
      .values({
        ...insertEmployee,
        name,
        firstName,
        lastName,
        updatedAt: new Date(),
      })
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updateEmployee: UpdateEmployee): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({
        ...updateEmployee,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // QR Token methods
  async createQrToken(insertQrToken: InsertQrToken): Promise<QrToken> {
    const [qrToken] = await db
      .insert(qrTokens)
      .values(insertQrToken)
      .returning();
    return qrToken;
  }

  async getValidQrToken(token: string): Promise<QrToken | undefined> {
    const [qrToken] = await db
      .select()
      .from(qrTokens)
      .where(
        and(
          eq(qrTokens.token, token),
          eq(qrTokens.isUsed, "false")
        )
      );
    
    // Check if token is expired
    if (qrToken && new Date(qrToken.expiresAt) > new Date()) {
      return qrToken;
    }
    
    return undefined;
  }

  async markQrTokenAsUsed(token: string): Promise<void> {
    await db
      .update(qrTokens)
      .set({ isUsed: "true" })
      .where(eq(qrTokens.token, token));
  }

  // Office location methods
  async getAllOfficeLocations(): Promise<OfficeLocation[]> {
    return await db.select().from(officeLocations);
  }

  async getOfficeLocation(id: string): Promise<OfficeLocation | undefined> {
    const [location] = await db.select().from(officeLocations).where(eq(officeLocations.id, id));
    return location || undefined;
  }

  async createOfficeLocation(insertLocation: InsertOfficeLocation): Promise<OfficeLocation> {
    const [location] = await db
      .insert(officeLocations)
      .values(insertLocation)
      .returning();
    return location;
  }

  async updateOfficeLocation(id: string, updateLocation: UpdateOfficeLocation): Promise<OfficeLocation | undefined> {
    const [location] = await db
      .update(officeLocations)
      .set({
        ...updateLocation,
        updatedAt: new Date(),
      })
      .where(eq(officeLocations.id, id))
      .returning();
    return location || undefined;
  }

  async deleteOfficeLocation(id: string): Promise<boolean> {
    const result = await db.delete(officeLocations).where(eq(officeLocations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getActiveOfficeLocations(): Promise<OfficeLocation[]> {
    return await db
      .select()
      .from(officeLocations)
      .where(eq(officeLocations.isActive, "true"));
  }

  // Clock-in methods
  async createClockInRecord(insertClockIn: InsertClockIn): Promise<ClockInRecord> {
    const [clockInRecord] = await db
      .insert(clockInRecords)
      .values(insertClockIn)
      .returning();
    return clockInRecord;
  }

  async getUserClockInRecords(userId: string): Promise<ClockInRecord[]> {
    return await db
      .select()
      .from(clockInRecords)
      .where(eq(clockInRecords.userId, userId));
  }

  // Work experience methods
  async getWorkExperiences(employeeId: string): Promise<WorkExperience[]> {
    return await db
      .select()
      .from(workExperiences)
      .where(eq(workExperiences.employeeId, employeeId));
  }

  async createWorkExperience(insertWorkExperience: InsertWorkExperience): Promise<WorkExperience> {
    const [workExperience] = await db
      .insert(workExperiences)
      .values(insertWorkExperience)
      .returning();
    return workExperience;
  }

  async updateWorkExperience(id: string, updateWorkExperience: UpdateWorkExperience): Promise<WorkExperience | undefined> {
    const [workExperience] = await db
      .update(workExperiences)
      .set(updateWorkExperience)
      .where(eq(workExperiences.id, id))
      .returning();
    return workExperience || undefined;
  }

  async deleteWorkExperience(id: string): Promise<boolean> {
    const result = await db.delete(workExperiences).where(eq(workExperiences.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Employee password methods - simplified for this demo
  async changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // In a real implementation, you would verify the current password against a user-employee relationship
    // For this demo, we'll just return true if the employee exists
    const employee = await this.getEmployee(employeeId);
    return !!employee;
  }

  async resetEmployeePassword(employeeId: string): Promise<string> {
    // In a real implementation, you would generate a new password and update it
    // For this demo, we'll just return a dummy new password
    const employee = await this.getEmployee(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    return "newpassword123"; // In real implementation, this would be a generated password
  }
}

export const storage = new DatabaseStorage();
