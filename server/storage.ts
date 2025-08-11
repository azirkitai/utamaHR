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
  type GroupPolicySetting,
  type InsertGroupPolicySetting,
  type UpdateGroupPolicySetting,
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
  groupPolicySettings,
  // Leave Application types
  type LeaveApplication,
  type InsertLeaveApplication,
  type UpdateLeaveApplication,
  // Company Leave Types
  companyLeaveTypes,
  type CompanyLeaveType,
  type InsertCompanyLeaveType,
  type UpdateCompanyLeaveType,
  // Leave Policy Settings
  leavePolicySettings,
  type LeavePolicySetting,
  type InsertLeavePolicySetting,
  type UpdateLeavePolicySetting,
  // Leave Balance Carry Forward
  leaveBalanceCarryForward,
  type LeaveBalanceCarryForward,
  type InsertLeaveBalanceCarryForward,
  type UpdateLeaveBalanceCarryForward,
  // Announcement types
  announcements,
  userAnnouncements,
  type SelectAnnouncement,
  type InsertAnnouncement,
  type SelectUserAnnouncement,
  type InsertUserAnnouncement,
  // Financial Claim Policy types
  financialClaimPolicies,
  type FinancialClaimPolicy,
  type InsertFinancialClaimPolicy,
  type UpdateFinancialClaimPolicy,
  // Claim Application types
  claimApplications,
  type ClaimApplication,
  type InsertClaimApplication,
  type UpdateClaimApplication,
  // Employee Salary types
  employeeSalaries,
  salaryBasicEarnings,
  salaryAdditionalItems,
  salaryDeductionItems,
  salaryCompanyContributions,
  type EmployeeSalary,
  type InsertEmployeeSalary,
  type UpdateEmployeeSalary,
  type SalaryBasicEarning,
  type InsertSalaryBasicEarning,
  type UpdateSalaryBasicEarning,
  type SalaryAdditionalItem,
  type InsertSalaryAdditionalItem,
  type UpdateSalaryAdditionalItem,
  type SalaryDeductionItem,
  type InsertSalaryDeductionItem,
  type UpdateSalaryDeductionItem,
  type SalaryCompanyContribution,
  type InsertSalaryCompanyContribution,
  type UpdateSalaryCompanyContribution,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, asc, ilike, or, gte, lte, inArray, not } from "drizzle-orm";

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
  getEmployeesWithApprovalRoles(): Promise<Employee[]>;
  
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
  deleteLeavePolicyByEmployeeAndType(employeeId: string, leaveType: string): Promise<boolean>;
  deleteLeavePolicyByType(leaveType: string): Promise<boolean>;
  
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
  createOrUpdateAttendanceRecord(data: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord>;

  // =================== COMPANY LEAVE TYPES METHODS ===================
  getCompanyLeaveTypes(): Promise<CompanyLeaveType[]>;
  getEnabledCompanyLeaveTypes(): Promise<CompanyLeaveType[]>;
  createCompanyLeaveType(companyLeaveType: InsertCompanyLeaveType): Promise<CompanyLeaveType>;
  updateCompanyLeaveType(id: string, companyLeaveType: UpdateCompanyLeaveType): Promise<CompanyLeaveType | undefined>;
  deleteCompanyLeaveType(id: string): Promise<boolean>;
  toggleCompanyLeaveType(leaveType: string, enabled: boolean): Promise<CompanyLeaveType | undefined>;

  // =================== GROUP POLICY SETTINGS METHODS ===================
  getGroupPolicySettings(leaveType: string): Promise<GroupPolicySetting[]>;
  createOrUpdateGroupPolicySetting(setting: InsertGroupPolicySetting): Promise<GroupPolicySetting>;
  deleteGroupPolicySetting(leaveType: string, role: string): Promise<boolean>;
  getAllGroupPolicySettings(): Promise<GroupPolicySetting[]>;
  
  // =================== LEAVE POLICY SETTINGS METHODS ===================
  getLeavePolicySettings(): Promise<LeavePolicySetting[]>;
  getLeavePolicySettingByLeaveType(leaveType: string): Promise<LeavePolicySetting | undefined>;
  createOrUpdateLeavePolicySetting(setting: InsertLeavePolicySetting): Promise<LeavePolicySetting>;
  deleteLeavePolicySetting(id: string): Promise<boolean>;

  // =================== DASHBOARD STATISTICS METHODS ===================
  getDashboardStatistics(): Promise<{
    totalClockIns: number;
    totalOnLeave: number;
    totalLeaveApproved: number;
  }>;
  
  getUserStatistics(userId: string): Promise<{
    leaveApproved: number;
    claimApproved: number;
    overtimeApproved: number;
    payrollRecord: number;
    paymentVoucher: number;
  }>;

  getPendingApprovalStatistics(): Promise<{
    pendingLeave: number;
    pendingClaim: number;
    pendingOvertime: number;
    pendingPayroll: number;
    pendingVoucher: number;
  }>;

  // =================== ANNOUNCEMENT METHODS ===================
  getAnnouncementsForUser(userId: string): Promise<any[]>;
  getAllAnnouncements(): Promise<any[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<SelectAnnouncement>;
  updateAnnouncement(announcementId: string, updates: Partial<InsertAnnouncement>): Promise<SelectAnnouncement>;
  getAnnouncementById(announcementId: string): Promise<SelectAnnouncement | null>;
  getUserAnnouncements(userId: string): Promise<SelectUserAnnouncement[]>;
  markAnnouncementAsRead(userId: string, announcementId: string): Promise<SelectUserAnnouncement>;
  deleteAnnouncement(announcementId: string): Promise<boolean>;

  // =================== LEAVE BALANCE CARRY FORWARD METHODS ===================
  getLeaveBalanceCarryForward(employeeId: string, year?: number): Promise<LeaveBalanceCarryForward[]>;
  createLeaveBalanceCarryForward(carryForward: InsertLeaveBalanceCarryForward): Promise<LeaveBalanceCarryForward>;
  updateLeaveBalanceCarryForward(id: string, updates: UpdateLeaveBalanceCarryForward): Promise<LeaveBalanceCarryForward | undefined>;
  deleteLeaveBalanceCarryForward(id: string): Promise<boolean>;
  processYearEndCarryForward(year: number): Promise<LeaveBalanceCarryForward[]>;

  // =================== FINANCIAL CLAIM POLICY METHODS ===================
  getAllFinancialClaimPolicies(): Promise<FinancialClaimPolicy[]>;
  getFinancialClaimPolicy(id: string): Promise<FinancialClaimPolicy | undefined>;
  createFinancialClaimPolicy(data: InsertFinancialClaimPolicy): Promise<FinancialClaimPolicy>;
  updateFinancialClaimPolicy(id: string, data: UpdateFinancialClaimPolicy): Promise<FinancialClaimPolicy | undefined>;
  deleteFinancialClaimPolicy(id: string): Promise<boolean>;
  
  // =================== CLAIM APPLICATION METHODS ===================
  getAllClaimApplications(): Promise<ClaimApplication[]>;
  getClaimApplicationsByEmployeeId(employeeId: string): Promise<ClaimApplication[]>;
  getClaimApplicationsByType(claimType: 'financial' | 'overtime'): Promise<ClaimApplication[]>;
  createClaimApplication(application: InsertClaimApplication): Promise<ClaimApplication>;
  updateClaimApplication(id: string, application: UpdateClaimApplication): Promise<ClaimApplication | undefined>;
  approveClaimApplication(id: string, approverId: string): Promise<boolean>;
  rejectClaimApplication(id: string, rejectorId: string, reason: string): Promise<boolean>;
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

  async getEmployeesWithApprovalRoles(): Promise<Employee[]> {
    // Join employees with users to get role information
    // Check both users.role and employees.role for approval roles
    const result = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        userId: employees.userId,
        role: sql`CASE 
          WHEN ${employees.role} IN ('Super Admin', 'Admin', 'HR Manager', 'PIC') THEN ${employees.role}
          WHEN ${users.role} IN ('Super Admin', 'Admin', 'HR Manager', 'PIC') THEN ${users.role}
          ELSE ${employees.role}
        END`.as('role')
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(
        sql`(${users.role} IN ('Super Admin', 'Admin', 'HR Manager', 'PIC') OR ${employees.role} IN ('Super Admin', 'Admin', 'HR Manager', 'PIC'))`
      );
    
    return result as any[];
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
    // Clean up null values for dates that might cause type issues
    const cleanedData = {
      ...insertWorkExperience,
      startDate: insertWorkExperience.startDate || null,
      endDate: insertWorkExperience.endDate || null,
    };
    const [record] = await db.insert(workExperiences).values([cleanedData]).returning();
    return record;
  }

  async updateWorkExperience(id: string, updateWorkExperience: UpdateWorkExperience): Promise<WorkExperience | undefined> {
    // Clean up null values for dates that might cause type issues
    const cleanedData = {
      ...updateWorkExperience,
      startDate: updateWorkExperience.startDate || undefined,
      endDate: updateWorkExperience.endDate || undefined,
    };
    const [record] = await db
      .update(workExperiences)
      .set(cleanedData)
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

  // Get leave policies with entitlement calculation for employee
  async getEmployeeLeavePoliciesWithEntitlement(employeeId: string): Promise<any[]> {
    try {
      console.log("🔍 Getting leave policies with entitlement for employee:", employeeId);
      
      // Get employee to find their role
      const employee = await this.getEmployee(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }
      
      console.log("👤 Employee found:", employee.fullName, "Role:", employee.role);

      // Get enabled company leave types
      const enabledLeaveTypes = await db.select()
        .from(companyLeaveTypes)
        .where(eq(companyLeaveTypes.enabled, true));

      console.log("📋 Enabled leave types found:", enabledLeaveTypes.length);

      const result = [];

      for (const leaveType of enabledLeaveTypes) {
        // Get group policy settings for this leave type
        const groupPolicies = await db.select()
          .from(groupPolicySettings)
          .where(eq(groupPolicySettings.leaveType, leaveType.id));

        // Map employee role to group policy role
        let mappedRole = employee.role;
        if (employee.role === 'Staff/Employee') {
          mappedRole = 'Employee';
        }
        
        // Find employee's role entitlement
        const employeePolicy = groupPolicies.find(gp => gp.role === mappedRole);
        
        if (employeePolicy && employeePolicy.enabled) {
          console.log(`✅ Found policy for ${leaveType.leaveType}: ${employeePolicy.entitlementDays} days`);
          
          // Calculate used leave days from approved applications for this employee and leave type
          const approvedApplications = await db.select()
            .from(leaveApplications)
            .where(
              and(
                eq(leaveApplications.employeeId, employeeId),
                eq(leaveApplications.leaveType, leaveType.leaveType),
                eq(leaveApplications.status, 'Approved')
              )
            );

          // Sum up total days used from approved applications
          const totalUsedDays = approvedApplications.reduce((sum, app) => {
            return sum + (Number(app.totalDays) || 0);
          }, 0);

          // Calculate actual balance: entitlement - used days
          const actualBalance = Math.max(0, (employeePolicy.entitlementDays || 0) - totalUsedDays);
          
          console.log(`📊 Leave balance calculation for ${leaveType.leaveType}: Entitlement=${employeePolicy.entitlementDays}, Used=${totalUsedDays}, Balance=${actualBalance}`);
          
          // Get leave policy settings for additional configuration
          const [policySettings] = await db.select()
            .from(leavePolicySettings)
            .where(eq(leavePolicySettings.leaveType, leaveType.id));

          result.push({
            id: leaveType.id,
            leaveType: leaveType.leaveType,
            entitlement: employeePolicy.entitlementDays,
            balance: actualBalance, // Real balance calculation
            usedDays: totalUsedDays, // Track used days
            remarks: policySettings?.leaveRemark || "Standard leave entitlement",
            action: "✓",
            included: true,
            groupPolicy: employeePolicy,
            policySettings: policySettings || null
          });
        } else {
          console.log(`❌ No policy found for ${leaveType.leaveType} and role ${mappedRole}`);
        }
      }

      console.log("📊 Final result:", result.length, "leave policies found");
      return result;
    } catch (error) {
      console.error("Error getting employee leave policies with entitlement:", error);
      throw error;
    }
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

  async deleteLeavePolicyByEmployeeAndType(employeeId: string, leaveType: string): Promise<boolean> {
    const result = await db.delete(leavePolicy)
      .where(
        and(
          eq(leavePolicy.employeeId, employeeId),
          eq(leavePolicy.leaveType, leaveType)
        )
      );
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
    try {
      console.log("Storage: Creating leave application with data:", JSON.stringify(insertLeaveApplication, null, 2));
      
      const [leaveApplication] = await db
        .insert(leaveApplications)
        .values(insertLeaveApplication)
        .returning();
        
      console.log("Storage: Successfully created leave application:", leaveApplication.id);
      return leaveApplication;
    } catch (error) {
      console.error("Storage: createLeaveApplication error:", error);
      console.error("Storage: Error stack:", error instanceof Error ? error.stack : 'Unknown error');
      throw error;
    }
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
  async getAttendanceRecords(params: { dateFrom?: Date; dateTo?: Date; employeeId?: string }): Promise<any[]> {
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
    
    // Build basic query first
    let query = db
      .select({
        // Attendance record fields
        id: attendanceRecords.id,
        employeeId: attendanceRecords.employeeId,
        date: attendanceRecords.date,
        clockInTime: attendanceRecords.clockInTime,
        clockOutTime: attendanceRecords.clockOutTime,
        clockInImage: attendanceRecords.clockInImage,
        clockOutImage: attendanceRecords.clockOutImage,
        totalHours: attendanceRecords.totalHours,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
        clockInLatitude: attendanceRecords.clockInLatitude,
        clockInLongitude: attendanceRecords.clockInLongitude,
        clockOutLatitude: attendanceRecords.clockOutLatitude,
        clockOutLongitude: attendanceRecords.clockOutLongitude,
        // Employee name field
        employeeName: employees.fullName,
      })
      .from(attendanceRecords)
      .leftJoin(employees, eq(attendanceRecords.employeeId, employees.id));
    
    // Add conditions and ordering
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;
    
    return await finalQuery.orderBy(desc(attendanceRecords.date));
  }

  async getTodayAttendanceRecord(employeeId: string, date: Date): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId),
        sql`DATE(${attendanceRecords.date}) = DATE(${date.toISOString()})`
      ));
    return record || undefined;
  }

  async createOrUpdateAttendanceRecord(data: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord> {
    if (!data.employeeId || !data.userId || !data.date) {
      throw new Error("EmployeeId, userId, dan date diperlukan");
    }

    // Check if record exists for today
    const today = data.date;
    const [existingRecord] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, data.employeeId),
        sql`DATE(${attendanceRecords.date}) = DATE(${today.toISOString()})`
      ));

    if (existingRecord) {
      // Update existing record
      const [updatedRecord] = await db
        .update(attendanceRecords)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, existingRecord.id))
        .returning();
      return updatedRecord;
    } else {
      // Create new record
      const [newRecord] = await db
        .insert(attendanceRecords)
        .values({
          ...data as InsertAttendanceRecord,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newRecord;
    }
  }

  // =================== COMPANY LEAVE TYPES METHODS ===================
  async getCompanyLeaveTypes(): Promise<CompanyLeaveType[]> {
    return await db.select().from(companyLeaveTypes).orderBy(companyLeaveTypes.leaveType);
  }

  async getEnabledCompanyLeaveTypes(): Promise<CompanyLeaveType[]> {
    return await db.select().from(companyLeaveTypes).where(eq(companyLeaveTypes.enabled, true)).orderBy(companyLeaveTypes.leaveType);
  }

  async createCompanyLeaveType(insertCompanyLeaveType: InsertCompanyLeaveType): Promise<CompanyLeaveType> {
    const [result] = await db
      .insert(companyLeaveTypes)
      .values(insertCompanyLeaveType)
      .returning();
    return result;
  }

  async updateCompanyLeaveType(id: string, updateData: UpdateCompanyLeaveType): Promise<CompanyLeaveType | undefined> {
    const [result] = await db
      .update(companyLeaveTypes)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(companyLeaveTypes.id, id))
      .returning();
    return result || undefined;
  }

  async deleteCompanyLeaveType(id: string): Promise<boolean> {
    const result = await db.delete(companyLeaveTypes).where(eq(companyLeaveTypes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async toggleCompanyLeaveType(leaveType: string, enabled: boolean): Promise<CompanyLeaveType | undefined> {
    const [result] = await db
      .update(companyLeaveTypes)
      .set({
        enabled,
        updatedAt: new Date()
      })
      .where(eq(companyLeaveTypes.leaveType, leaveType))
      .returning();
    return result || undefined;
  }

  // =================== GROUP POLICY SETTINGS METHODS ===================
  async getGroupPolicySettings(leaveType: string): Promise<GroupPolicySetting[]> {
    return await db
      .select()
      .from(groupPolicySettings)
      .where(eq(groupPolicySettings.leaveType, leaveType));
  }

  async createOrUpdateGroupPolicySetting(setting: InsertGroupPolicySetting): Promise<GroupPolicySetting> {
    // Check if setting already exists
    const [existing] = await db
      .select()
      .from(groupPolicySettings)
      .where(and(
        eq(groupPolicySettings.leaveType, setting.leaveType),
        eq(groupPolicySettings.role, setting.role)
      ));

    if (existing) {
      // Update existing setting
      const [updated] = await db
        .update(groupPolicySettings)
        .set({
          ...setting,
          updatedAt: new Date()
        })
        .where(eq(groupPolicySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new setting
      const [created] = await db
        .insert(groupPolicySettings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async deleteGroupPolicySetting(leaveType: string, role: string): Promise<boolean> {
    const result = await db
      .delete(groupPolicySettings)
      .where(and(
        eq(groupPolicySettings.leaveType, leaveType),
        eq(groupPolicySettings.role, role)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllGroupPolicySettings(): Promise<GroupPolicySetting[]> {
    return await db.select().from(groupPolicySettings);
  }

  // =================== LEAVE POLICY SETTINGS METHODS ===================
  async getLeavePolicySettings(): Promise<LeavePolicySetting[]> {
    return await db.select().from(leavePolicySettings).orderBy(leavePolicySettings.leaveType);
  }

  async getLeavePolicySettingByLeaveType(leaveType: string): Promise<LeavePolicySetting | undefined> {
    const [result] = await db
      .select()
      .from(leavePolicySettings)
      .where(eq(leavePolicySettings.leaveType, leaveType));
    return result || undefined;
  }

  async createOrUpdateLeavePolicySetting(setting: InsertLeavePolicySetting): Promise<LeavePolicySetting> {
    // Check if setting already exists
    const existing = await this.getLeavePolicySettingByLeaveType(setting.leaveType);

    if (existing) {
      // Update existing setting
      const [updated] = await db
        .update(leavePolicySettings)
        .set({
          ...setting,
          updatedAt: new Date()
        })
        .where(eq(leavePolicySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new setting
      const [created] = await db
        .insert(leavePolicySettings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async deleteLeavePolicySetting(id: string): Promise<boolean> {
    const result = await db
      .delete(leavePolicySettings)
      .where(eq(leavePolicySettings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =================== DASHBOARD STATISTICS METHODS ===================
  async getDashboardStatistics(): Promise<{
    totalClockIns: number;
    totalOnLeave: number;
    totalLeaveApproved: number;
  }> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Count clock-ins for today
      const [clockInResult] = await db.select({
        count: count(clockInRecords.id)
      })
      .from(clockInRecords)
      .where(sql`DATE(${clockInRecords.clockInTime}) = ${today}`);

      // Count employees currently on leave (approved leave applications for today)
      const [onLeaveResult] = await db.select({
        count: count(leaveApplications.id)
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.status, 'Approved'),
          sql`${today} >= DATE(${leaveApplications.startDate})`,
          sql`${today} <= DATE(${leaveApplications.endDate})`
        )
      );

      // Count total approved leave applications this year
      const currentYear = new Date().getFullYear();
      const [approvedLeaveResult] = await db.select({
        count: count(leaveApplications.id)
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.status, 'Approved'),
          sql`EXTRACT(YEAR FROM ${leaveApplications.appliedDate}) = ${currentYear}`
        )
      );

      return {
        totalClockIns: clockInResult?.count || 0,
        totalOnLeave: onLeaveResult?.count || 0,
        totalLeaveApproved: approvedLeaveResult?.count || 0
      };
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      return {
        totalClockIns: 0,
        totalOnLeave: 0,
        totalLeaveApproved: 0
      };
    }
  }

  // Get user-specific statistics 
  async getUserStatistics(userId: string): Promise<{
    leaveApproved: number;
    claimApproved: number;
    overtimeApproved: number;
    payrollRecord: number;
    paymentVoucher: number;
  }> {
    try {
      // Get employee record for this user
      const employee = await this.getEmployeeByUserId(userId);
      if (!employee) {
        return {
          leaveApproved: 0,
          claimApproved: 0,
          overtimeApproved: 0,
          payrollRecord: 0,
          paymentVoucher: 0
        };
      }

      // Count approved leave applications for this user
      const [leaveResult] = await db.select({
        count: count(leaveApplications.id),
        totalDays: sql<number>`COALESCE(SUM(CAST(${leaveApplications.totalDays} AS INTEGER)), 0)`
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.employeeId, employee.id),
          eq(leaveApplications.status, 'Approved')
        )
      );

      return {
        leaveApproved: Number(leaveResult?.totalDays || 0), // Total days approved
        claimApproved: 0, // TODO: Implement when claim system is ready
        overtimeApproved: 0, // TODO: Implement when overtime system is ready
        payrollRecord: 0, // TODO: Implement when payroll system is ready
        paymentVoucher: 0 // TODO: Implement when payment voucher system is ready
      };
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      return {
        leaveApproved: 0,
        claimApproved: 0,
        overtimeApproved: 0,
        payrollRecord: 0,
        paymentVoucher: 0
      };
    }
  }

  // Get pending approval statistics for dashboard
  async getPendingApprovalStatistics(): Promise<{
    pendingLeave: number;
    pendingClaim: number;
    pendingOvertime: number;
    pendingPayroll: number;
    pendingVoucher: number;
  }> {
    try {
      // Count pending leave applications
      const [pendingLeaveResult] = await db.select({
        count: count(leaveApplications.id)
      })
      .from(leaveApplications)
      .where(
        or(
          eq(leaveApplications.status, 'Pending'),
          eq(leaveApplications.status, 'Submitted'),
          eq(leaveApplications.status, 'Under Review')
        )
      );

      return {
        pendingLeave: Number(pendingLeaveResult?.count || 0),
        pendingClaim: 0, // TODO: Implement when claim system is ready
        pendingOvertime: 0, // TODO: Implement when overtime system is ready
        pendingPayroll: 0, // TODO: Implement when payroll system is ready
        pendingVoucher: 0 // TODO: Implement when voucher system is ready
      };
    } catch (error) {
      console.error("Error fetching pending approval statistics:", error);
      return {
        pendingLeave: 0,
        pendingClaim: 0,
        pendingOvertime: 0,
        pendingPayroll: 0,
        pendingVoucher: 0
      };
    }
  }

  // =================== ANNOUNCEMENT METHODS ===================
  async getAnnouncementsForUser(userId: string): Promise<any[]> {
    try {
      const allAnnouncements = await db
        .select({
          id: announcements.id,
          title: announcements.title,
          message: announcements.message,
          department: announcements.department,
          announcerName: announcements.announcerName,
          createdAt: announcements.createdAt,
          updatedAt: announcements.updatedAt,
          attachment: announcements.attachment,
        })
        .from(announcements)
        .where(
          or(
            sql`${userId} = ANY(${announcements.targetEmployees})`,
            sql`array_length(${announcements.targetEmployees}, 1) = 0`
          )
        )
        .orderBy(desc(announcements.createdAt));

      // Check read status for each announcement
      const announcementsWithStatus = await Promise.all(
        allAnnouncements.map(async (announcement) => {
          const [readStatus] = await db
            .select()
            .from(userAnnouncements)
            .where(
              and(
                eq(userAnnouncements.userId, userId),
                eq(userAnnouncements.announcementId, announcement.id)
              )
            );

          return {
            ...announcement,
            status: readStatus?.isRead ? 'Read' : 'New',
            createdDate: announcement.createdAt?.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            updatedDate: announcement.updatedAt?.toLocaleDateString('en-GB', {
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            }),
          };
        })
      );

      return announcementsWithStatus;
    } catch (error) {
      console.error('Error getting announcements for user:', error);
      throw error;
    }
  }

  async getAllAnnouncements(): Promise<any[]> {
    try {
      const allAnnouncements = await db
        .select({
          id: announcements.id,
          title: announcements.title,
          message: announcements.message,
          department: announcements.department,
          announcerName: announcements.announcerName,
          createdAt: announcements.createdAt,
          updatedAt: announcements.updatedAt,
          attachment: announcements.attachment,
          targetEmployees: announcements.targetEmployees
        })
        .from(announcements)
        .orderBy(desc(announcements.createdAt));

      return allAnnouncements.map(announcement => ({
        ...announcement,
        createdDate: announcement.createdAt?.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        updatedDate: announcement.updatedAt?.toLocaleDateString('en-GB', {
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        }),
      }));
    } catch (error) {
      console.error('Error getting all announcements:', error);
      throw error;
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<SelectAnnouncement> {
    try {
      const [newAnnouncement] = await db
        .insert(announcements)
        .values(announcement)
        .returning();

      // Create user announcement records for all target employees
      if (announcement.targetEmployees && announcement.targetEmployees.length > 0) {
        const userAnnouncementRecords = announcement.targetEmployees.map(employeeId => ({
          userId: employeeId,
          announcementId: newAnnouncement.id,
          isRead: false,
        }));

        await db.insert(userAnnouncements).values(userAnnouncementRecords);
      }

      return newAnnouncement;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  async getUserAnnouncements(userId: string): Promise<SelectUserAnnouncement[]> {
    try {
      const userAnnouncementRecords = await db
        .select()
        .from(userAnnouncements)
        .where(eq(userAnnouncements.userId, userId))
        .orderBy(desc(userAnnouncements.createdAt));

      return userAnnouncementRecords;
    } catch (error) {
      console.error('Error getting user announcements:', error);
      throw error;
    }
  }

  async markAnnouncementAsRead(userId: string, announcementId: string): Promise<SelectUserAnnouncement> {
    try {
      const [existingRecord] = await db
        .select()
        .from(userAnnouncements)
        .where(
          and(
            eq(userAnnouncements.userId, userId),
            eq(userAnnouncements.announcementId, announcementId)
          )
        );

      if (existingRecord) {
        const [updated] = await db
          .update(userAnnouncements)
          .set({ isRead: true, readAt: new Date() })
          .where(eq(userAnnouncements.id, existingRecord.id))
          .returning();
        return updated;
      } else {
        const [newRecord] = await db
          .insert(userAnnouncements)
          .values({
            userId,
            announcementId,
            isRead: true,
            readAt: new Date(),
          })
          .returning();
        return newRecord;
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      throw error;
    }
  }

  async updateAnnouncement(announcementId: string, updates: Partial<InsertAnnouncement>): Promise<SelectAnnouncement> {
    try {
      const [updatedAnnouncement] = await db
        .update(announcements)
        .set(updates)
        .where(eq(announcements.id, announcementId))
        .returning();

      return updatedAnnouncement;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  async getAnnouncementById(announcementId: string): Promise<SelectAnnouncement | null> {
    try {
      const [announcement] = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, announcementId))
        .limit(1);

      return announcement || null;
    } catch (error) {
      console.error('Error getting announcement by ID:', error);
      throw error;
    }
  }

  async deleteAnnouncement(announcementId: string): Promise<boolean> {
    try {
      // Delete user-announcement records first (due to foreign key constraints)
      await db.delete(userAnnouncements)
        .where(eq(userAnnouncements.announcementId, announcementId));

      // Delete the announcement
      const result = await db.delete(announcements)
        .where(eq(announcements.id, announcementId));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  // =================== LEAVE BALANCE CARRY FORWARD METHODS ===================
  async getLeaveBalanceCarryForward(employeeId: string, year?: number): Promise<LeaveBalanceCarryForward[]> {
    try {
      let query = db.select().from(leaveBalanceCarryForward).where(eq(leaveBalanceCarryForward.employeeId, employeeId));
      
      if (year) {
        query = db.select().from(leaveBalanceCarryForward).where(and(
          eq(leaveBalanceCarryForward.employeeId, employeeId),
          eq(leaveBalanceCarryForward.year, year)
        ));
      }
      
      return await query.orderBy(desc(leaveBalanceCarryForward.year), asc(leaveBalanceCarryForward.leaveType));
    } catch (error) {
      console.error('Error getting leave balance carry forward:', error);
      throw error;
    }
  }

  async createLeaveBalanceCarryForward(carryForward: InsertLeaveBalanceCarryForward): Promise<LeaveBalanceCarryForward> {
    try {
      const [record] = await db
        .insert(leaveBalanceCarryForward)
        .values(carryForward)
        .returning();
      return record;
    } catch (error) {
      console.error('Error creating leave balance carry forward:', error);
      throw error;
    }
  }

  async updateLeaveBalanceCarryForward(id: string, updates: UpdateLeaveBalanceCarryForward): Promise<LeaveBalanceCarryForward | undefined> {
    try {
      const [record] = await db
        .update(leaveBalanceCarryForward)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(leaveBalanceCarryForward.id, id))
        .returning();
      return record || undefined;
    } catch (error) {
      console.error('Error updating leave balance carry forward:', error);
      throw error;
    }
  }

  async deleteLeaveBalanceCarryForward(id: string): Promise<boolean> {
    try {
      const result = await db.delete(leaveBalanceCarryForward).where(eq(leaveBalanceCarryForward.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting leave balance carry forward:', error);
      throw error;
    }
  }

  async processYearEndCarryForward(year: number): Promise<LeaveBalanceCarryForward[]> {
    try {
      console.log(`Processing year-end carry forward for ${year}`);
      
      // Get all employees and their leave policies
      const allEmployees = await this.getAllEmployees();
      const carryForwardRecords: LeaveBalanceCarryForward[] = [];
      
      for (const employee of allEmployees) {
        // Get all company leave types where carry forward is enabled
        const leaveTypes = await db
          .select()
          .from(companyLeaveTypes)
          .innerJoin(
            leavePolicySettings,
            eq(companyLeaveTypes.id, leavePolicySettings.leaveType)
          )
          .where(eq(leavePolicySettings.carryForward, true));

        for (const { company_leave_types: leaveType, leave_policy_settings: settings } of leaveTypes) {
          // Calculate used leave days for this employee and leave type in the specified year
          const usedLeave = await db
            .select({
              totalUsed: sql<number>`COALESCE(SUM(${leaveApplications.totalDays}), 0)`
            })
            .from(leaveApplications)
            .where(
              and(
                eq(leaveApplications.employeeId, employee.id),
                eq(leaveApplications.leaveType, leaveType.name),
                eq(leaveApplications.status, 'Approved'),
                sql`EXTRACT(YEAR FROM ${leaveApplications.startDate}) = ${year}`
              )
            );

          const totalUsed = Number(usedLeave[0]?.totalUsed || 0);
          
          // Get entitlement from group policy settings
          const entitlement = await db
            .select()
            .from(groupPolicySettings)
            .where(
              and(
                eq(groupPolicySettings.leaveType, leaveType.id),
                eq(groupPolicySettings.role, employee.role || 'Employee')
              )
            )
            .limit(1);

          const entitlementDays = Number(entitlement[0]?.entitlementDays || 0);
          const remainingDays = Math.max(0, entitlementDays - totalUsed);
          
          // Only create carry forward record if there are remaining days
          if (remainingDays > 0) {
            const carryForwardRecord = await this.createLeaveBalanceCarryForward({
              employeeId: employee.id,
              leaveType: leaveType.name,
              year: year,
              entitlementDays: entitlementDays.toString(),
              usedDays: totalUsed.toString(),
              remainingDays: remainingDays.toString(),
              carriedForwardDays: remainingDays.toString(),
              status: 'active'
            });
            
            carryForwardRecords.push(carryForwardRecord);
          }
        }
      }
      
      console.log(`Created ${carryForwardRecords.length} carry forward records for ${year}`);
      return carryForwardRecords;
    } catch (error) {
      console.error('Error processing year-end carry forward:', error);
      throw error;
    }
  }

  // =================== FINANCIAL CLAIM POLICY METHODS ===================
  async getAllFinancialClaimPolicies(): Promise<FinancialClaimPolicy[]> {
    return await db.select().from(financialClaimPolicies).where(eq(financialClaimPolicies.enabled, true));
  }

  async getFinancialClaimPolicy(id: string): Promise<FinancialClaimPolicy | undefined> {
    const [policy] = await db.select().from(financialClaimPolicies).where(eq(financialClaimPolicies.id, id));
    return policy || undefined;
  }

  async createFinancialClaimPolicy(data: InsertFinancialClaimPolicy): Promise<FinancialClaimPolicy> {
    const [policy] = await db
      .insert(financialClaimPolicies)
      .values(data)
      .returning();
    return policy;
  }

  async updateFinancialClaimPolicy(id: string, data: UpdateFinancialClaimPolicy): Promise<FinancialClaimPolicy | undefined> {
    const [policy] = await db
      .update(financialClaimPolicies)
      .set(data)
      .where(eq(financialClaimPolicies.id, id))
      .returning();
    return policy || undefined;
  }

  async deleteFinancialClaimPolicy(id: string): Promise<boolean> {
    const result = await db
      .delete(financialClaimPolicies)
      .where(eq(financialClaimPolicies.id, id));
    return result.rowCount > 0;
  }

  // =================== CLAIM APPLICATION METHODS ===================
  async getAllClaimApplications(): Promise<ClaimApplication[]> {
    return await db.select().from(claimApplications).orderBy(desc(claimApplications.dateSubmitted));
  }

  async getClaimApplicationsByEmployeeId(employeeId: string): Promise<ClaimApplication[]> {
    return await db.select()
      .from(claimApplications)
      .where(eq(claimApplications.employeeId, employeeId))
      .orderBy(desc(claimApplications.dateSubmitted));
  }

  async getClaimApplicationsByType(claimType: 'financial' | 'overtime'): Promise<ClaimApplication[]> {
    return await db.select()
      .from(claimApplications)
      .where(eq(claimApplications.claimType, claimType))
      .orderBy(desc(claimApplications.dateSubmitted));
  }

  async createClaimApplication(application: InsertClaimApplication): Promise<ClaimApplication> {
    const [claimApp] = await db
      .insert(claimApplications)
      .values(application)
      .returning();
    return claimApp;
  }

  async updateClaimApplication(id: string, application: UpdateClaimApplication): Promise<ClaimApplication | undefined> {
    const [claimApp] = await db
      .update(claimApplications)
      .set(application)
      .where(eq(claimApplications.id, id))
      .returning();
    return claimApp || undefined;
  }

  async approveClaimApplication(id: string, approverId: string): Promise<boolean> {
    // Get current claim application
    const [currentApp] = await db.select().from(claimApplications).where(eq(claimApplications.id, id));
    if (!currentApp) return false;

    // Determine next status based on current status and approval level
    let newStatus: 'firstLevelApproved' | 'approved' = 'firstLevelApproved';
    let firstLevelApproverId = currentApp.firstLevelApproverId;
    let secondLevelApproverId = currentApp.secondLevelApproverId;

    if (currentApp.status === 'pending') {
      newStatus = 'firstLevelApproved';
      firstLevelApproverId = approverId;
    } else if (currentApp.status === 'firstLevelApproved') {
      newStatus = 'approved';
      secondLevelApproverId = approverId;
    }

    const [updatedApp] = await db
      .update(claimApplications)
      .set({ 
        status: newStatus,
        firstLevelApproverId,
        secondLevelApproverId,
        dateApproved: newStatus === 'approved' ? new Date() : null
      })
      .where(eq(claimApplications.id, id))
      .returning();

    return !!updatedApp;
  }

  async rejectClaimApplication(id: string, rejectorId: string, reason: string): Promise<boolean> {
    const [updatedApp] = await db
      .update(claimApplications)
      .set({ 
        status: 'rejected',
        rejectedBy: rejectorId,
        rejectionReason: reason,
        dateRejected: new Date()
      })
      .where(eq(claimApplications.id, id))
      .returning();

    return !!updatedApp;
  }

  // =================== EMPLOYEE SALARY METHODS ===================
  async getEmployeeSalaryByEmployeeId(employeeId: string): Promise<any> {
    const [salary] = await db.select().from(employeeSalaries).where(eq(employeeSalaries.employeeId, employeeId));
    if (!salary) {
      return null;
    }

    const [basicEarnings, additionalItems, deductionItems, companyContributions] = await Promise.all([
      db.select().from(salaryBasicEarnings).where(eq(salaryBasicEarnings.salaryId, salary.id)),
      db.select().from(salaryAdditionalItems).where(eq(salaryAdditionalItems.salaryId, salary.id)),
      db.select().from(salaryDeductionItems).where(eq(salaryDeductionItems.salaryId, salary.id)),
      db.select().from(salaryCompanyContributions).where(eq(salaryCompanyContributions.salaryId, salary.id))
    ]);

    return {
      ...salary,
      basicEarnings,
      additionalItems,
      deductionItems,
      companyContributions
    };
  }

  async createEmployeeSalary(data: InsertEmployeeSalary): Promise<EmployeeSalary> {
    const [salary] = await db
      .insert(employeeSalaries)
      .values(data)
      .returning();
    return salary;
  }

  async updateEmployeeSalary(employeeId: string, data: UpdateEmployeeSalary): Promise<EmployeeSalary | undefined> {
    const [salary] = await db
      .update(employeeSalaries)
      .set(data)
      .where(eq(employeeSalaries.employeeId, employeeId))
      .returning();
    return salary || undefined;
  }

  // Master Salary Data methods (JSON-based approach)
  async getMasterSalaryData(employeeId: string): Promise<any> {
    // Try to get existing salary data from database
    const [existingSalary] = await db
      .select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.employeeId, employeeId));

    if (existingSalary) {
      // Parse JSON fields and return existing data
      const result = {
        employeeId,
        salaryType: existingSalary.salaryType || "Monthly",
        basicSalary: parseFloat(existingSalary.basicSalary || "0"),
        additionalItems: existingSalary.additionalItems ? JSON.parse(existingSalary.additionalItems) : [
          { code: "ADV", label: "Advance Salary", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
          { code: "SUBS", label: "Subsistence Allowance", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
          { code: "RESP", label: "Extra Responsibility Allowance", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
          { code: "BIK", label: "BIK/VOLA", amount: 0, hideOnPayslip: true, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }}
        ],
        deductions: existingSalary.deductions ? JSON.parse(existingSalary.deductions) : {
          epfEmployee: 0, socsoEmployee: 0, eisEmployee: 0, advance: 0, unpaidLeave: 0, pcb39: 0, pcb38: 0, zakat: 0, other: 0
        },
        contributions: existingSalary.contributions ? JSON.parse(existingSalary.contributions) : {
          epfEmployer: 0, socsoEmployer: 0, eisEmployer: 0, medicalCard: 0, groupTermLife: 0, medicalCompany: 0, hrdf: 0
        },
        settings: existingSalary.settings ? JSON.parse(existingSalary.settings) : {
          isCalculatedInPayment: true, isSocsoEnabled: true, isEisEnabled: true, epfCalcMethod: "PERCENT", epfEmployeeRate: 11.0, epfEmployerRate: 13.0, hrdfEmployerRate: 1.0
        },
        taxExemptions: existingSalary.taxExemptions ? JSON.parse(existingSalary.taxExemptions) : {},
        remarks: ""
      };
      return result;
    }

    // Check if employee exists
    const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      return null;
    }

    // Return default structure if no saved data
    return {
      employeeId,
      salaryType: "Monthly",
      basicSalary: 0,
      additionalItems: [
        { code: "ADV", label: "Advance Salary", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
        { code: "SUBS", label: "Subsistence Allowance", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
        { code: "RESP", label: "Extra Responsibility Allowance", amount: 0, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }},
        { code: "BIK", label: "BIK/VOLA", amount: 0, hideOnPayslip: true, flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }}
      ],
      deductions: { epfEmployee: 0, socsoEmployee: 0, eisEmployee: 0, advance: 0, unpaidLeave: 0, pcb39: 0, pcb38: 0, zakat: 0, other: 0 },
      contributions: { epfEmployer: 0, socsoEmployer: 0, eisEmployer: 0, medicalCard: 0, groupTermLife: 0, medicalCompany: 0, hrdf: 0 },
      settings: { isCalculatedInPayment: true, isSocsoEnabled: true, isEisEnabled: true, epfCalcMethod: "PERCENT", epfEmployeeRate: 11.0, epfEmployerRate: 13.0, hrdfEmployerRate: 1.0 },
      taxExemptions: {},
      remarks: ""
    };
  }

  async saveMasterSalaryData(data: any): Promise<any> {
    console.log('Saving master salary data:', data);
    
    // Ensure epfCalcMethod is either PERCENT or CUSTOM (not FIXED)
    if (data.settings?.epfCalcMethod === "FIXED") {
      data.settings.epfCalcMethod = "CUSTOM";
    }

    const { employeeId, salaryType, basicSalary, additionalItems, deductions, contributions, settings, taxExemptions } = data;
    
    // Prepare JSON strings for database storage
    const dataToSave = {
      employeeId,
      salaryType: salaryType || "Monthly",
      basicSalary: basicSalary?.toString() || "0.00",
      additionalItems: additionalItems ? JSON.stringify(additionalItems) : null,
      deductions: deductions ? JSON.stringify(deductions) : null,
      contributions: contributions ? JSON.stringify(contributions) : null,
      settings: settings ? JSON.stringify(settings) : null,
      taxExemptions: taxExemptions ? JSON.stringify(taxExemptions) : null,
    };

    // Check if record exists
    const [existing] = await db
      .select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.employeeId, employeeId));

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(employeeSalaries)
        .set({
          ...dataToSave,
          updatedAt: new Date()
        })
        .where(eq(employeeSalaries.employeeId, employeeId))
        .returning();
      
      console.log('Updated salary record:', updated);
      return data; // Return original data structure for frontend
    } else {
      // Create new record
      const [created] = await db
        .insert(employeeSalaries)
        .values(dataToSave)
        .returning();
      
      console.log('Created salary record:', created);
      return data; // Return original data structure for frontend
    }
  }

  async createSalaryBasicEarning(data: InsertSalaryBasicEarning): Promise<SalaryBasicEarning> {
    const [earning] = await db
      .insert(salaryBasicEarnings)
      .values(data)
      .returning();
    return earning;
  }

  async updateSalaryBasicEarning(id: string, data: UpdateSalaryBasicEarning): Promise<SalaryBasicEarning | undefined> {
    const [earning] = await db
      .update(salaryBasicEarnings)
      .set(data)
      .where(eq(salaryBasicEarnings.id, id))
      .returning();
    return earning || undefined;
  }

  async deleteSalaryBasicEarning(id: string): Promise<boolean> {
    const result = await db
      .delete(salaryBasicEarnings)
      .where(eq(salaryBasicEarnings.id, id));
    return result.rowCount > 0;
  }

  async createSalaryAdditionalItem(data: InsertSalaryAdditionalItem): Promise<SalaryAdditionalItem> {
    const [item] = await db
      .insert(salaryAdditionalItems)
      .values(data)
      .returning();
    return item;
  }

  async updateSalaryAdditionalItem(id: string, data: UpdateSalaryAdditionalItem): Promise<SalaryAdditionalItem | undefined> {
    const [item] = await db
      .update(salaryAdditionalItems)
      .set(data)
      .where(eq(salaryAdditionalItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteSalaryAdditionalItem(id: string): Promise<boolean> {
    const result = await db
      .delete(salaryAdditionalItems)
      .where(eq(salaryAdditionalItems.id, id));
    return result.rowCount > 0;
  }

  async createSalaryDeductionItem(data: InsertSalaryDeductionItem): Promise<SalaryDeductionItem> {
    const [item] = await db
      .insert(salaryDeductionItems)
      .values(data)
      .returning();
    return item;
  }

  async updateSalaryDeductionItem(id: string, data: UpdateSalaryDeductionItem): Promise<SalaryDeductionItem | undefined> {
    const [item] = await db
      .update(salaryDeductionItems)
      .set(data)
      .where(eq(salaryDeductionItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteSalaryDeductionItem(id: string): Promise<boolean> {
    const result = await db
      .delete(salaryDeductionItems)
      .where(eq(salaryDeductionItems.id, id));
    return result.rowCount > 0;
  }

  async createSalaryCompanyContribution(data: InsertSalaryCompanyContribution): Promise<SalaryCompanyContribution> {
    const [contribution] = await db
      .insert(salaryCompanyContributions)
      .values(data)
      .returning();
    return contribution;
  }

  async updateSalaryCompanyContribution(id: string, data: UpdateSalaryCompanyContribution): Promise<SalaryCompanyContribution | undefined> {
    const [contribution] = await db
      .update(salaryCompanyContributions)
      .set(data)
      .where(eq(salaryCompanyContributions.id, id))
      .returning();
    return contribution || undefined;
  }

  async deleteSalaryCompanyContribution(id: string): Promise<boolean> {
    const result = await db
      .delete(salaryCompanyContributions)
      .where(eq(salaryCompanyContributions.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
