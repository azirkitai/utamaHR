import { 
  // User types
  type User, 
  type InsertUser, 
  // Employee types
  type Employee, 
  type InsertEmployee, 
  type UpdateEmployee,
  // Employment types
  type Employment,
  type InsertEmployment,
  type UpdateEmployment,
  // Contact types
  type Contact,
  type InsertContact,
  type UpdateContact,
  // Family Details types
  type FamilyDetails,
  type InsertFamilyDetails,
  type UpdateFamilyDetails,
  // Compensation types
  type Compensation,
  type InsertCompensation,
  type UpdateCompensation,
  // Document types
  type Document,
  type InsertDocument,
  type UpdateDocument,
  // Equipment types
  type Equipment,
  type InsertEquipment,
  type UpdateEquipment,
  // Leave Policy types
  type LeavePolicy,
  type InsertLeavePolicy,
  type UpdateLeavePolicy,
  // Claim Policy types
  type ClaimPolicy,
  type InsertClaimPolicy,
  type UpdateClaimPolicy,
  // Disciplinary types
  type Disciplinary,
  type InsertDisciplinary,
  type UpdateDisciplinary,
  // App Setting types
  type AppSetting,
  type InsertAppSetting,
  type UpdateAppSetting,
  // Work Experience types
  type WorkExperience,
  type InsertWorkExperience,
  employeeDocuments,
  type EmployeeDocument,
  type InsertEmployeeDocument,
  type UpdateWorkExperience,
  // QR Code types
  type QrToken,
  type InsertQrToken,
  type OfficeLocation,
  type InsertOfficeLocation,
  type UpdateOfficeLocation,
  type ClockInRecord,
  type InsertClockIn,
  // Attendance types
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type UpdateAttendanceRecord,
  // Tables
  users, 
  employees,
  employment,
  contact,
  familyDetails,
  compensation,
  documents,
  equipment,
  leavePolicy,
  claimPolicy,
  disciplinary,
  appSetting,
  workExperiences,
  qrTokens,
  officeLocations,
  clockInRecords,
  attendanceRecords,
  leaveApplications,
  // Leave Application types
  type LeaveApplication,
  type InsertLeaveApplication,
  type UpdateLeaveApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // =================== USER METHODS ===================
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // =================== EMPLOYEE METHODS ===================
  getAllEmployees(): Promise<Employee[]>;
  getAllEmployeesWithDetails(): Promise<any[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // =================== EMPLOYMENT METHODS ===================
  getEmploymentByEmployeeId(employeeId: string): Promise<Employment | undefined>;
  createEmployment(employment: InsertEmployment): Promise<Employment>;
  updateEmployment(id: string, employment: UpdateEmployment): Promise<Employment | undefined>;
  
  // =================== CONTACT METHODS ===================
  getContactByEmployeeId(employeeId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: UpdateContact): Promise<Contact | undefined>;
  
  // =================== FAMILY DETAILS METHODS ===================
  getFamilyDetails(employeeId: string): Promise<FamilyDetails[]>;
  createFamilyDetails(familyDetails: InsertFamilyDetails): Promise<FamilyDetails>;
  updateFamilyDetails(id: string, familyDetails: UpdateFamilyDetails): Promise<FamilyDetails | undefined>;
  deleteFamilyDetails(id: string): Promise<boolean>;
  
  // =================== COMPENSATION METHODS ===================
  getCompensation(employeeId: string): Promise<Compensation | undefined>;
  createCompensation(compensation: InsertCompensation): Promise<Compensation>;
  updateCompensation(employeeId: string, compensation: UpdateCompensation): Promise<Compensation | undefined>;
  
  // =================== DOCUMENT METHODS ===================
  getDocuments(employeeId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: UpdateDocument): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // =================== EQUIPMENT METHODS ===================
  getEquipments(employeeId: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, equipment: UpdateEquipment): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  
  // =================== LEAVE POLICY METHODS ===================
  getLeavePolicies(employeeId: string): Promise<LeavePolicy[]>;
  getActiveLeavePolicies(): Promise<LeavePolicy[]>;
  createLeavePolicy(leavePolicy: InsertLeavePolicy): Promise<LeavePolicy>;
  updateLeavePolicy(id: string, leavePolicy: UpdateLeavePolicy): Promise<LeavePolicy | undefined>;
  deleteLeavePolicy(id: string): Promise<boolean>;
  
  // =================== CLAIM POLICY METHODS ===================
  getClaimPolicies(employeeId: string): Promise<ClaimPolicy[]>;
  createClaimPolicy(claimPolicy: InsertClaimPolicy): Promise<ClaimPolicy>;
  updateClaimPolicy(id: string, claimPolicy: UpdateClaimPolicy): Promise<ClaimPolicy | undefined>;
  deleteClaimPolicy(id: string): Promise<boolean>;
  
  // =================== DISCIPLINARY METHODS ===================
  getDisciplinaryRecords(employeeId: string): Promise<Disciplinary[]>;
  createDisciplinary(disciplinary: InsertDisciplinary): Promise<Disciplinary>;
  updateDisciplinary(id: string, disciplinary: UpdateDisciplinary): Promise<Disciplinary | undefined>;
  deleteDisciplinary(id: string): Promise<boolean>;
  
  // =================== APP SETTING METHODS ===================
  getAppSetting(employeeId: string): Promise<AppSetting | undefined>;
  createAppSetting(appSetting: InsertAppSetting): Promise<AppSetting>;
  updateAppSetting(employeeId: string, appSetting: UpdateAppSetting): Promise<AppSetting | undefined>;
  
  // =================== WORK EXPERIENCE METHODS ===================
  getWorkExperiences(employeeId: string): Promise<WorkExperience[]>;
  createWorkExperience(workExperience: InsertWorkExperience): Promise<WorkExperience>;
  updateWorkExperience(id: string, workExperience: UpdateWorkExperience): Promise<WorkExperience | undefined>;
  deleteWorkExperience(id: string): Promise<boolean>;
  
  // =================== QR TOKEN METHODS ===================
  createQrToken(qrToken: InsertQrToken): Promise<QrToken>;
  getValidQrToken(token: string): Promise<QrToken | undefined>;
  markQrTokenAsUsed(token: string): Promise<void>;
  
  // =================== OFFICE LOCATION METHODS ===================
  getAllOfficeLocations(): Promise<OfficeLocation[]>;
  getOfficeLocation(id: string): Promise<OfficeLocation | undefined>;
  createOfficeLocation(location: InsertOfficeLocation): Promise<OfficeLocation>;
  updateOfficeLocation(id: string, location: UpdateOfficeLocation): Promise<OfficeLocation | undefined>;
  deleteOfficeLocation(id: string): Promise<boolean>;
  getActiveOfficeLocations(): Promise<OfficeLocation[]>;
  
  // =================== CLOCK-IN METHODS ===================
  createClockInRecord(clockIn: InsertClockIn): Promise<ClockInRecord>;
  getUserClockInRecords(userId: string): Promise<ClockInRecord[]>;
  
  // =================== PASSWORD MANAGEMENT METHODS ===================
  changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  resetEmployeePassword(employeeId: string): Promise<string>;
  
  // =================== LEAVE APPLICATION METHODS ===================
  getAllLeaveApplications(): Promise<LeaveApplication[]>;
  getLeaveApplicationsByEmployeeId(employeeId: string): Promise<LeaveApplication[]>;
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: string, leaveApplication: UpdateLeaveApplication): Promise<LeaveApplication | undefined>;
  deleteLeaveApplication(id: string): Promise<boolean>;

  // =================== DASHBOARD STATISTICS ===================
  getEmployeeStatistics(): Promise<{ activeCount: number; resignedCount: number; totalCount: number }>;

  // =================== ATTENDANCE RECORD METHODS ===================
  getAttendanceRecords(params: { dateFrom?: Date; dateTo?: Date; employeeId?: string }): Promise<AttendanceRecord[]>;
}

export class DatabaseStorage implements IStorage {
  // =================== USER METHODS ===================
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

  async updateUser(id: string, updateUser: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // =================== EMPLOYEE METHODS ===================
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getAllEmployeesWithDetails(): Promise<any[]> {
    const employeesList = await db.select().from(employees);
    
    const employeesWithDetails = await Promise.all(
      employeesList.map(async (emp) => {
        const employmentData = await this.getEmploymentByEmployeeId(emp.id);
        const contactData = await this.getContactByEmployeeId(emp.id);
        
        return {
          ...emp,
          employment: employmentData,
          contact: contactData
        };
      })
    );
    
    return employeesWithDetails;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    // Ensure fullName is provided
    let fullName = insertEmployee.fullName;
    if (!fullName && insertEmployee.firstName && insertEmployee.lastName) {
      fullName = `${insertEmployee.firstName} ${insertEmployee.lastName}`.trim();
    } else if (!fullName && insertEmployee.firstName) {
      fullName = insertEmployee.firstName;
    } else if (!fullName) {
      fullName = 'Unknown Employee';
    }
    
    const [employee] = await db
      .insert(employees)
      .values({
        ...insertEmployee,
        fullName
      })
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updateEmployee: UpdateEmployee): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({
        ...updateEmployee,
        updatedAt: new Date()
      })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== EMPLOYMENT METHODS ===================
  async getEmploymentByEmployeeId(employeeId: string): Promise<Employment | undefined> {
    const [record] = await db.select().from(employment).where(eq(employment.employeeId, employeeId));
    return record || undefined;
  }

  async createEmployment(insertEmployment: InsertEmployment): Promise<Employment> {
    const [record] = await db
      .insert(employment)
      .values(insertEmployment)
      .returning();
    return record;
  }

  async updateEmployment(id: string, updateEmployment: UpdateEmployment): Promise<Employment | undefined> {
    const [record] = await db
      .update(employment)
      .set({
        ...updateEmployment,
        updatedAt: new Date()
      })
      .where(eq(employment.id, id))
      .returning();
    return record || undefined;
  }

  // =================== CONTACT METHODS ===================
  async getContactByEmployeeId(employeeId: string): Promise<Contact | undefined> {
    const [record] = await db.select().from(contact).where(eq(contact.employeeId, employeeId));
    return record || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [record] = await db
      .insert(contact)
      .values(insertContact)
      .returning();
    return record;
  }

  async updateContact(id: string, updateContact: UpdateContact): Promise<Contact | undefined> {
    const [record] = await db
      .update(contact)
      .set({
        ...updateContact,
        updatedAt: new Date()
      })
      .where(eq(contact.id, id))
      .returning();
    return record || undefined;
  }

  // =================== FAMILY DETAILS METHODS ===================
  async getFamilyDetails(employeeId: string): Promise<FamilyDetails[]> {
    return await db.select().from(familyDetails).where(eq(familyDetails.employeeId, employeeId));
  }

  async createFamilyDetails(insertFamilyDetails: InsertFamilyDetails): Promise<FamilyDetails> {
    const [record] = await db
      .insert(familyDetails)
      .values(insertFamilyDetails)
      .returning();
    return record;
  }

  async updateFamilyDetails(id: string, updateFamilyDetails: UpdateFamilyDetails): Promise<FamilyDetails | undefined> {
    const [record] = await db
      .update(familyDetails)
      .set({
        ...updateFamilyDetails,
        updatedAt: new Date()
      })
      .where(eq(familyDetails.id, id))
      .returning();
    return record || undefined;
  }

  async deleteFamilyDetails(id: string): Promise<boolean> {
    const result = await db.delete(familyDetails).where(eq(familyDetails.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== COMPENSATION METHODS ===================
  async getCompensation(employeeId: string): Promise<Compensation | undefined> {
    const [record] = await db.select().from(compensation).where(eq(compensation.employeeId, employeeId));
    return record || undefined;
  }

  async createCompensation(insertCompensation: InsertCompensation): Promise<Compensation> {
    const [record] = await db
      .insert(compensation)
      .values(insertCompensation)
      .returning();
    return record;
  }

  async updateCompensation(employeeId: string, updateCompensation: UpdateCompensation): Promise<Compensation | undefined> {
    const [record] = await db
      .update(compensation)
      .set({
        ...updateCompensation,
        updatedAt: new Date()
      })
      .where(eq(compensation.employeeId, employeeId))
      .returning();
    return record || undefined;
  }

  // =================== DOCUMENT METHODS ===================
  async getDocuments(employeeId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.employeeId, employeeId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [record] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return record;
  }

  async updateDocument(id: string, updateDocument: UpdateDocument): Promise<Document | undefined> {
    const [record] = await db
      .update(documents)
      .set({
        ...updateDocument,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return record || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== EQUIPMENT METHODS ===================
  async getEquipments(employeeId: string): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.employeeId, employeeId));
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [record] = await db
      .insert(equipment)
      .values(insertEquipment)
      .returning();
    return record;
  }

  async updateEquipment(id: string, updateEquipment: UpdateEquipment): Promise<Equipment | undefined> {
    const [record] = await db
      .update(equipment)
      .set({
        ...updateEquipment,
        updatedAt: new Date()
      })
      .where(eq(equipment.id, id))
      .returning();
    return record || undefined;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id));
    return (result.rowCount ?? 0) > 0;
  }



  // =================== DISCIPLINARY METHODS ===================
  async getDisciplinaryRecords(employeeId: string): Promise<Disciplinary[]> {
    return await db.select().from(disciplinary).where(eq(disciplinary.employeeId, employeeId));
  }

  async createDisciplinary(insertDisciplinary: InsertDisciplinary): Promise<Disciplinary> {
    const [record] = await db
      .insert(disciplinary)
      .values(insertDisciplinary)
      .returning();
    return record;
  }

  async updateDisciplinary(id: string, updateDisciplinary: UpdateDisciplinary): Promise<Disciplinary | undefined> {
    const [record] = await db
      .update(disciplinary)
      .set({
        ...updateDisciplinary,
        updatedAt: new Date()
      })
      .where(eq(disciplinary.id, id))
      .returning();
    return record || undefined;
  }

  async deleteDisciplinary(id: string): Promise<boolean> {
    const result = await db.delete(disciplinary).where(eq(disciplinary.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== APP SETTING METHODS ===================
  async getAppSetting(employeeId: string): Promise<AppSetting | undefined> {
    const [record] = await db.select().from(appSetting).where(eq(appSetting.employeeId, employeeId));
    return record || undefined;
  }

  async createAppSetting(insertAppSetting: InsertAppSetting): Promise<AppSetting> {
    const [record] = await db
      .insert(appSetting)
      .values(insertAppSetting)
      .returning();
    return record;
  }

  async updateAppSetting(employeeId: string, updateAppSetting: UpdateAppSetting): Promise<AppSetting | undefined> {
    const [record] = await db
      .update(appSetting)
      .set({
        ...updateAppSetting,
        updatedAt: new Date()
      })
      .where(eq(appSetting.employeeId, employeeId))
      .returning();
    return record || undefined;
  }

  // =================== WORK EXPERIENCE METHODS ===================
  async getWorkExperiences(employeeId: string): Promise<WorkExperience[]> {
    return await db.select().from(workExperiences).where(eq(workExperiences.employeeId, employeeId));
  }

  async createWorkExperience(insertWorkExperience: InsertWorkExperience): Promise<WorkExperience> {
    const [record] = await db.insert(workExperiences).values(insertWorkExperience).returning();
    return record;
  }

  async updateWorkExperience(id: string, updateWorkExperience: UpdateWorkExperience): Promise<WorkExperience | undefined> {
    const [record] = await db
      .update(workExperiences)
      .set(updateWorkExperience)
      .where(eq(workExperiences.id, id))
      .returning();
    return record || undefined;
  }

  async deleteWorkExperience(id: string): Promise<boolean> {
    const result = await db.delete(workExperiences).where(eq(workExperiences.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== QR TOKEN METHODS ===================
  async createQrToken(insertQrToken: InsertQrToken): Promise<QrToken> {
    const [token] = await db
      .insert(qrTokens)
      .values(insertQrToken)
      .returning();
    return token;
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
    return qrToken || undefined;
  }

  async markQrTokenAsUsed(token: string): Promise<void> {
    await db
      .update(qrTokens)
      .set({ isUsed: "true" })
      .where(eq(qrTokens.token, token));
  }

  // =================== OFFICE LOCATION METHODS ===================
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
        updatedAt: new Date()
      })
      .where(eq(officeLocations.id, id))
      .returning();
    return location || undefined;
  }

  async deleteOfficeLocation(id: string): Promise<boolean> {
    const result = await db.delete(officeLocations).where(eq(officeLocations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveOfficeLocations(): Promise<OfficeLocation[]> {
    return await db.select().from(officeLocations).where(eq(officeLocations.isActive, "true"));
  }

  // =================== EMPLOYEE DOCUMENTS METHODS ===================
  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId)).orderBy(desc(employeeDocuments.createdAt));
  }

  async getEmployeeDocument(id: string): Promise<EmployeeDocument | undefined> {
    const [result] = await db.select().from(employeeDocuments).where(eq(employeeDocuments.id, id));
    return result;
  }

  async createEmployeeDocument(document: InsertEmployeeDocument): Promise<EmployeeDocument> {
    const [result] = await db.insert(employeeDocuments).values({
      ...document,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updateEmployeeDocument(id: string, updates: Partial<InsertEmployeeDocument>): Promise<EmployeeDocument | undefined> {
    const [result] = await db.update(employeeDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employeeDocuments.id, id))
      .returning();
    return result;
  }

  async deleteEmployeeDocument(id: string): Promise<void> {
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
  }

  // =================== CLOCK-IN METHODS ===================
  async createClockInRecord(insertClockIn: InsertClockIn): Promise<ClockInRecord> {
    const [record] = await db
      .insert(clockInRecords)
      .values(insertClockIn)
      .returning();
    return record;
  }

  async getUserClockInRecords(userId: string): Promise<ClockInRecord[]> {
    return await db.select().from(clockInRecords).where(eq(clockInRecords.userId, userId));
  }

  // =================== PASSWORD MANAGEMENT METHODS ===================
  async changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get employee to find associated user
      const employee = await this.getEmployee(employeeId);
      if (!employee) return false;
      
      const user = await this.getUser(employee.userId);
      if (!user) return false;
      
      // Verify current password (in production, this would be hashed)
      if (user.password !== currentPassword) return false;
      
      // Update password (in production, this would be hashed)
      const updatedUser = await this.updateUser(employee.userId, { password: newPassword });
      return !!updatedUser;
    } catch (error) {
      console.error("Change password error:", error);
      return false;
    }
  }

  async resetEmployeePassword(employeeId: string): Promise<string> {
    try {
      // Get employee to find associated user
      const employee = await this.getEmployee(employeeId);
      if (!employee) throw new Error("Employee not found");
      
      // Generate new temporary password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Update password (in production, this would be hashed)
      const updatedUser = await this.updateUser(employee.userId, { password: newPassword });
      if (!updatedUser) throw new Error("Failed to reset password");
      
      return newPassword;
    } catch (error) {
      console.error("Reset password error:", error);
      throw new Error("Failed to reset password");
    }
  }



  // =================== LEAVE POLICY METHODS ===================
  async getLeavePolicies(employeeId: string): Promise<LeavePolicy[]> {
    return await db.select().from(leavePolicy).where(eq(leavePolicy.employeeId, employeeId)).orderBy(desc(leavePolicy.createdAt));
  }

  async getActiveLeavePolicies(): Promise<LeavePolicy[]> {
    return await db.select().from(leavePolicy).where(eq(leavePolicy.included, true)).orderBy(desc(leavePolicy.createdAt));
  }

  async createLeavePolicy(insertLeavePolicy: InsertLeavePolicy): Promise<LeavePolicy> {
    const [result] = await db
      .insert(leavePolicy)
      .values(insertLeavePolicy)
      .returning();
    return result;
  }

  async updateLeavePolicy(id: string, updateData: UpdateLeavePolicy): Promise<LeavePolicy | undefined> {
    const [result] = await db
      .update(leavePolicy)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(leavePolicy.id, id))
      .returning();
    return result || undefined;
  }

  async deleteLeavePolicy(id: string): Promise<boolean> {
    const result = await db.delete(leavePolicy).where(eq(leavePolicy.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteLeavePolicyByType(leaveType: string): Promise<boolean> {
    const result = await db.delete(leavePolicy).where(eq(leavePolicy.leaveType, leaveType));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== CLAIM POLICY METHODS ===================
  async getClaimPolicies(employeeId: string): Promise<ClaimPolicy[]> {
    return await db.select().from(claimPolicy).where(eq(claimPolicy.employeeId, employeeId)).orderBy(desc(claimPolicy.createdAt));
  }

  async createClaimPolicy(insertClaimPolicy: InsertClaimPolicy): Promise<ClaimPolicy> {
    const [result] = await db
      .insert(claimPolicy)
      .values(insertClaimPolicy)
      .returning();
    return result;
  }

  async updateClaimPolicy(id: string, updateData: UpdateClaimPolicy): Promise<ClaimPolicy | undefined> {
    const [result] = await db
      .update(claimPolicy)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(claimPolicy.id, id))
      .returning();
    return result || undefined;
  }

  async deleteClaimPolicy(id: string): Promise<boolean> {
    const result = await db.delete(claimPolicy).where(eq(claimPolicy.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // =================== LEAVE APPLICATION METHODS ===================
  async getAllLeaveApplications(): Promise<LeaveApplication[]> {
    return await db.select().from(leaveApplications).orderBy(desc(leaveApplications.appliedDate));
  }
  
  async getLeaveApplicationsByEmployeeId(employeeId: string): Promise<LeaveApplication[]> {
    return await db.select().from(leaveApplications)
      .where(eq(leaveApplications.employeeId, employeeId))
      .orderBy(desc(leaveApplications.appliedDate));
  }
  
  async createLeaveApplication(insertLeaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const [leaveApplication] = await db
      .insert(leaveApplications)
      .values(insertLeaveApplication)
      .returning();
    return leaveApplication;
  }
  
  async updateLeaveApplication(id: string, updateLeaveApplication: UpdateLeaveApplication): Promise<LeaveApplication | undefined> {
    const [leaveApplication] = await db
      .update(leaveApplications)
      .set(updateLeaveApplication)
      .where(eq(leaveApplications.id, id))
      .returning();
    return leaveApplication || undefined;
  }
  
  async deleteLeaveApplication(id: string): Promise<boolean> {
    const result = await db.delete(leaveApplications).where(eq(leaveApplications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== DASHBOARD STATISTICS ===================
  async getEmployeeStatistics(): Promise<{ activeCount: number; resignedCount: number; totalCount: number }> {
    // Count active employees (status = 'employed')
    const [activeResult] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, 'employed'));

    // Count resigned employees (status = 'terminated' or 'retired')
    const [resignedResult] = await db
      .select({ count: count() })
      .from(employees)
      .where(sql`${employees.status} IN ('terminated', 'retired')`);

    // Count total employees
    const [totalResult] = await db
      .select({ count: count() })
      .from(employees);

    return {
      activeCount: activeResult.count,
      resignedCount: resignedResult.count,
      totalCount: totalResult.count
    };
  }

  // =================== ATTENDANCE RECORD METHODS ===================
  async getAttendanceRecords(params: { dateFrom?: Date; dateTo?: Date; employeeId?: string }): Promise<AttendanceRecord[]> {
    let query = db.select().from(attendanceRecords);
    
    const conditions = [];
    
    // Add employeeId filter if provided
    if (params.employeeId) {
      conditions.push(eq(attendanceRecords.employeeId, params.employeeId));
    }
    
    // Add date range filters
    if (params.dateFrom) {
      conditions.push(sql`${attendanceRecords.date} >= ${params.dateFrom.toISOString().split('T')[0]}`);
    }
    
    if (params.dateTo) {
      conditions.push(sql`${attendanceRecords.date} <= ${params.dateTo.toISOString().split('T')[0]}`);
    }
    
    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by date descending (newest first)
    return await query.orderBy(desc(attendanceRecords.date));
  }
}

export const storage = new DatabaseStorage();
