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
  // Company Settings types
  type CompanySetting,
  type InsertCompanySetting,
  type UpdateCompanySetting,
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
  companySettings,
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
  // Approval Settings
  approvalSettings,
  // Claim Application types
  claimApplications,
  type ClaimApplication,
  type InsertClaimApplication,
  type UpdateClaimApplication,
  // Payment Voucher types
  paymentVouchers,
  type PaymentVoucher,
  type InsertPaymentVoucher,
  type UpdatePaymentVoucher,
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
  // Overtime tables
  overtimeSettings,
  overtimePolicies,
  overtimeApprovalSettings,
  // Payroll types
  payrollDocuments,
  payrollItems,
  userPayrollRecords,
  type PayrollDocument,
  type InsertPayrollDocument,
  type UpdatePayrollDocument,
  type PayrollItem,
  type InsertPayrollItem,
  type UpdatePayrollItem,
  type UserPayrollRecord,
  type InsertUserPayrollRecord,
  type UpdateUserPayrollRecord,
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
  getClaimApplication(id: string): Promise<ClaimApplication | undefined>;
  getClaimApplicationsByEmployeeId(employeeId: string): Promise<ClaimApplication[]>;
  getClaimApplicationsByType(claimType: 'financial' | 'overtime'): Promise<ClaimApplication[]>;
  createClaimApplication(application: InsertClaimApplication): Promise<ClaimApplication>;
  updateClaimApplication(id: string, application: UpdateClaimApplication): Promise<ClaimApplication | undefined>;
  approveClaimApplication(id: string, approverId: string): Promise<boolean>;
  rejectClaimApplication(id: string, rejectorId: string, reason: string): Promise<boolean>;
  
  // =================== PAYROLL METHODS ===================
  getAllPayrollDocuments(): Promise<PayrollDocument[]>;
  getPayrollDocument(id: string): Promise<PayrollDocument | undefined>;
  getPayrollDocumentByYearMonth(year: number, month: number): Promise<PayrollDocument | undefined>;
  createPayrollDocument(document: InsertPayrollDocument): Promise<PayrollDocument>;
  updatePayrollDocument(id: string, document: UpdatePayrollDocument): Promise<PayrollDocument | undefined>;
  deletePayrollDocument(id: string): Promise<boolean>;
  
  getPayrollItemsByDocumentId(documentId: string): Promise<PayrollItem[]>;
  getPayrollItem(id: string): Promise<PayrollItem | undefined>;
  getPayrollItemByDocumentAndEmployee(documentId: string, employeeId: string): Promise<PayrollItem | undefined>;
  createPayrollItem(item: InsertPayrollItem): Promise<PayrollItem>;
  updatePayrollItem(id: string, item: UpdatePayrollItem): Promise<PayrollItem | undefined>;
  deletePayrollItem(id: string): Promise<boolean>;
  generatePayrollItems(documentId: string): Promise<PayrollItem[]>;
  
  // =================== COMPANY SETTINGS METHODS ===================
  getCompanySettings(): Promise<CompanySetting | undefined>;
  createCompanySettings(settings: InsertCompanySetting): Promise<CompanySetting>;
  updateCompanySettings(id: string, settings: UpdateCompanySetting): Promise<CompanySetting | undefined>;
  
  // =================== PAYMENT VOUCHER METHODS ===================
  getAllPaymentVouchers(): Promise<PaymentVoucher[]>;
  getPaymentVoucher(id: string): Promise<PaymentVoucher | undefined>;
  createPaymentVoucher(voucher: InsertPaymentVoucher): Promise<PaymentVoucher>;
  updatePaymentVoucher(id: string, voucher: UpdatePaymentVoucher): Promise<PaymentVoucher | undefined>;
  deletePaymentVoucher(id: string): Promise<boolean>;
  generateVoucherNumber(): Promise<string>;
  getApprovedFinancialClaims(year: number, month: number): Promise<ClaimApplication[]>;
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
      startDate: insertWorkExperience.startDate || undefined,
      endDate: insertWorkExperience.endDate || undefined,
    };
    const [record] = await db.insert(workExperiences).values(cleanedData).returning();
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

      // Count pending financial claim applications
      const [pendingFinancialResult] = await db.select({
        count: count(claimApplications.id)
      })
      .from(claimApplications)
      .where(
        and(
          eq(claimApplications.claimCategory, 'financial'),
          eq(claimApplications.status, 'pending')
        )
      );

      // Count pending overtime claim applications
      const [pendingOvertimeResult] = await db.select({
        count: count(claimApplications.id)
      })
      .from(claimApplications)
      .where(
        and(
          eq(claimApplications.claimCategory, 'overtime'),
          eq(claimApplications.status, 'pending')
        )
      );

      return {
        pendingLeave: Number(pendingLeaveResult?.count || 0),
        pendingClaim: Number(pendingFinancialResult?.count || 0),
        pendingOvertime: Number(pendingOvertimeResult?.count || 0),
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
                eq(leaveApplications.leaveType, leaveType.leaveType),
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
              leaveType: leaveType.leaveType,
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
    return (result.rowCount ?? 0) > 0;
  }

  // =================== CLAIM APPLICATION METHODS ===================
  async getAllClaimApplications(): Promise<ClaimApplication[]> {
    return await db.select().from(claimApplications).orderBy(desc(claimApplications.dateSubmitted));
  }

  async getClaimApplication(id: string): Promise<ClaimApplication | undefined> {
    const [claim] = await db.select().from(claimApplications).where(eq(claimApplications.id, id));
    return claim;
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

  async calculateOvertimeAmount(employeeId: string, totalHours: number): Promise<number> {
    try {
      // Get employee salary info from Master Salary
      const salaryInfo = await this.getEmployeeSalaryByEmployeeId(employeeId);
      
      if (!salaryInfo) {
        console.log(`No salary info found for employee ${employeeId}, using default rate`);
        // Default hourly rate if no salary info (RM 15/hour for overtime)
        return totalHours * 15.00;
      }
      
      // Use basic_salary from Master Salary (employee_salaries table) as primary source
      let monthlySalary = parseFloat(salaryInfo.basicSalary?.toString() || '0');
      
      // If master salary is 0 or null, try to get from basic earnings as fallback
      if (monthlySalary <= 0 && salaryInfo.basicEarnings && salaryInfo.basicEarnings.length > 0) {
        const basicEarnings = salaryInfo.basicEarnings[0];
        monthlySalary = parseFloat(basicEarnings.amount) || 0;
        console.log(`Using Basic Earnings as fallback: RM ${monthlySalary}`);
      }
      
      if (monthlySalary <= 0) {
        console.log(`Invalid monthly salary for employee ${employeeId}, using default rate`);
        return totalHours * 15.00;
      }
      
      // Calculate hourly rate using Malaysian Employment Act 1955 formula:
      // OT sejam = (Gaji sebulan ÷ 26 hari) ÷ Jam kerja sehari × 1.5
      const dailySalary = monthlySalary / 26; // Gaji sehari
      const hourlyRate = dailySalary / 8; // Assuming 8 working hours per day
      
      // Overtime rate as per Malaysian Employment Act 1955 (1.5x)
      const overtimeRate = hourlyRate * 1.5;
      
      // Calculate total overtime amount
      const overtimeAmount = totalHours * overtimeRate;
      
      console.log(`=== OVERTIME CALCULATION (MALAYSIAN EMPLOYMENT ACT 1955) ===`);
      console.log(`Employee ID: ${employeeId}`);
      console.log(`Master Salary (basic_salary): RM ${salaryInfo.basicSalary || 'NULL'}`);
      console.log(`Monthly salary used: RM ${monthlySalary}`);
      console.log(`Daily salary (÷26): RM ${dailySalary.toFixed(2)}`);
      console.log(`Hourly rate (÷8): RM ${hourlyRate.toFixed(2)}`);
      console.log(`Overtime rate (1.5x): RM ${overtimeRate.toFixed(2)}`);
      console.log(`Total hours: ${totalHours}`);
      console.log(`Total overtime amount: RM ${overtimeAmount.toFixed(2)}`);
      console.log(`=== END CALCULATION ===`);
      
      return parseFloat(overtimeAmount.toFixed(2));
    } catch (error) {
      console.error('Error calculating overtime amount:', error);
      // Return default calculation if error occurs
      return totalHours * 15.00;
    }
  }

  async createClaimApplication(application: InsertClaimApplication): Promise<ClaimApplication> {
    // If this is an overtime application, calculate the amount automatically
    if (application.claimCategory === 'overtime' && application.totalHours && application.employeeId) {
      const calculatedAmount = await this.calculateOvertimeAmount(application.employeeId, application.totalHours);
      application.amount = calculatedAmount;
      application.calculatedAmount = calculatedAmount;
    }

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

    // Get approval settings to check if second level is required
    let approvalSettings = null;
    if (currentApp.claimType === 'overtime') {
      const [overtimeApprovalData] = await db.select().from(overtimeApprovalSettings).limit(1);
      approvalSettings = overtimeApprovalData;
    } else if (currentApp.claimType === 'financial') {
      // For financial claims, check if we have groupPolicySettings
      try {
        const result = await db.execute(sql`
          SELECT id, "firstLevelApprovalId", "secondLevelApprovalId", "enableApproval", "approvalLevel"
          FROM approval_settings 
          WHERE type = 'financial' 
          LIMIT 1
        `);
        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0] as any;
          approvalSettings = {
            id: row.id,
            firstLevelApprovalId: row.firstLevelApprovalId,
            secondLevelApprovalId: row.secondLevelApprovalId,
            enableApproval: row.enableApproval,
            approvalLevel: row.approvalLevel
          };
        }
      } catch (error) {
        console.log('Financial approval settings not found, using single-level approval');
        approvalSettings = null;
      }
    }

    // Determine status based on approval workflow
    let newStatus: 'firstLevelApproved' | 'approved' | 'awaitingSecondApproval' = 'firstLevelApproved';
    let firstLevelApproverId = currentApp.firstLevelApproverId;
    let secondLevelApproverId = currentApp.secondLevelApproverId;

    if (currentApp.status === 'Pending' || currentApp.status === 'pending') {
      // First level approval
      firstLevelApproverId = approverId;
      
      // Check if second level approver is set
      let hasSecondLevel = false;
      if (currentApp.claimType === 'overtime') {
        hasSecondLevel = approvalSettings?.secondLevel && approvalSettings.secondLevel.trim() !== '';
      } else if (currentApp.claimType === 'financial') {
        hasSecondLevel = approvalSettings?.secondLevelApprovalId && approvalSettings.secondLevelApprovalId.trim() !== '';
      }
      
      if (hasSecondLevel) {
        // Two-level approval: set to awaiting second approval
        newStatus = 'firstLevelApproved';
      } else {
        // Single-level approval: directly approve
        newStatus = 'approved';
      }
    } else if (currentApp.status === 'firstLevelApproved' || currentApp.status === 'First Level Approved' || currentApp.status === 'awaitingSecondApproval') {
      // Second level approval - final approval
      newStatus = 'approved';
      secondLevelApproverId = approverId;
    }

    const [updatedApp] = await db
      .update(claimApplications)
      .set({ 
        status: newStatus,
        firstLevelApproverId,
        secondLevelApproverId,
        approvedAt: newStatus === 'approved' ? new Date() : null
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

  // Calculate overtime amount for an employee for a given month
  async calculateEmployeeOvertimeAmount(employeeId: string, year: number, month: number): Promise<number> {
    console.log(`=== OVERTIME CALCULATION START ===`);
    console.log(`Employee ID: ${employeeId}, Year: ${year}, Month: ${month}`);
    try {
      // Get employee salary details (modern format with JSON)
      const [salary] = await db.select().from(employeeSalaries).where(eq(employeeSalaries.employeeId, employeeId));
      if (!salary) return 0;

      // Parse the salary data
      let basicSalary = 0;
      if (salary.additionalItems) {
        const additionalItems = JSON.parse(salary.additionalItems);
        // Find basic salary from additional items or use basicSalary field
        basicSalary = parseFloat(salary.basicSalary || '0');
      } else {
        basicSalary = parseFloat(salary.basicSalary || '0');
      }

      if (basicSalary <= 0) return 0;

      // Get overtime settings
      const [overtimeSettingsData] = await db.select().from(overtimeSettings).limit(1);
      if (!overtimeSettingsData) return 0;

      // Get overtime policies
      const policies = await db.select().from(overtimePolicies).where(eq(overtimePolicies.enabled, true));
      if (!policies.length) return 0;

      // Get approved overtime claims for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const approvedOvertimeClaims = await db.select()
        .from(claimApplications)
        .where(
          and(
            eq(claimApplications.employeeId, employeeId),
            eq(claimApplications.claimType, 'overtime'),
            or(
              eq(claimApplications.status, 'approved'),
              eq(claimApplications.status, 'firstLevelApproved'),
              eq(claimApplications.status, 'Approved')
            ),
            gte(claimApplications.claimDate, startDate),
            lte(claimApplications.claimDate, endDate)
          )
        );

      if (!approvedOvertimeClaims.length) return 0;

      // Calculate base hourly rate
      const workingDaysPerMonth = overtimeSettingsData.workingDaysPerMonth || 26;
      const workingHoursPerDay = overtimeSettingsData.workingHoursPerDay || 8;
      const hourlyRate = basicSalary / workingDaysPerMonth / workingHoursPerDay;

      // Calculate total overtime amount
      let totalOvertimeAmount = 0;

      for (const claim of approvedOvertimeClaims) {
        let totalHours = parseFloat(claim.totalHours || '0');
        
        // If total_hours is 0 or null, calculate from start_time and end_time
        if (totalHours === 0 && claim.startTime && claim.endTime) {
          const startTime = claim.startTime.split(':');
          const endTime = claim.endTime.split(':');
          const startHour = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
          const endHour = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
          totalHours = Math.max(0, endHour - startHour);
        }
        
        const policyType = claim.overtimePolicyType || 'normal';
        
        // Find the policy multiplier
        const policy = policies.find(p => p.policyType === policyType);
        const multiplier = policy ? parseFloat(policy.multiplier || '1.5') : 1.5;
        
        // Calculate overtime amount for this claim
        const overtimeAmount = hourlyRate * totalHours * multiplier;
        totalOvertimeAmount += overtimeAmount;
        
        console.log(`Overtime calculation for claim ${claim.id}:`, {
          totalHours,
          hourlyRate,
          multiplier,
          overtimeAmount,
          policyType
        });
      }

      console.log(`Total overtime amount calculated: RM ${totalOvertimeAmount.toFixed(2)}`);
      console.log(`=== OVERTIME CALCULATION END ===`);
      return Math.round(totalOvertimeAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating overtime amount:', error);
      console.log(`=== OVERTIME CALCULATION ERROR ===`);
      return 0;
    }
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
        taxExemptions: existingSalary.taxExemptions ? JSON.parse(existingSalary.taxExemptions) : [],
        manualYtd: existingSalary.manualYtd ? JSON.parse(existingSalary.manualYtd) : {},
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
      taxExemptions: [],
      manualYtd: {},
      remarks: ""
    };
  }

  async saveMasterSalaryData(data: any): Promise<any> {
    console.log('Saving master salary data:', data);
    
    // Ensure epfCalcMethod is either PERCENT or CUSTOM (not FIXED)
    if (data.settings?.epfCalcMethod === "FIXED") {
      data.settings.epfCalcMethod = "CUSTOM";
    }

    const { employeeId, salaryType, basicSalary, additionalItems, deductions, contributions, settings, taxExemptions, manualYtd } = data;
    
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
      manualYtd: manualYtd ? JSON.stringify(manualYtd) : null,
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
  }

  // =================== PAYROLL METHODS ===================
  async getAllPayrollDocuments(): Promise<PayrollDocument[]> {
    return await db.select().from(payrollDocuments).orderBy(desc(payrollDocuments.year), desc(payrollDocuments.month));
  }

  async getPayrollDocument(id: string): Promise<PayrollDocument | undefined> {
    const [document] = await db.select().from(payrollDocuments).where(eq(payrollDocuments.id, id));
    return document || undefined;
  }

  async getPayrollDocumentByYearMonth(year: number, month: number): Promise<PayrollDocument | undefined> {
    const [document] = await db
      .select()
      .from(payrollDocuments)
      .where(and(eq(payrollDocuments.year, year), eq(payrollDocuments.month, month)));
    return document || undefined;
  }

  async createPayrollDocument(insertDocument: InsertPayrollDocument): Promise<PayrollDocument> {
    const [document] = await db
      .insert(payrollDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updatePayrollDocument(id: string, updateDocument: UpdatePayrollDocument): Promise<PayrollDocument | undefined> {
    const [document] = await db
      .update(payrollDocuments)
      .set({
        ...updateDocument,
        updatedAt: new Date()
      })
      .where(eq(payrollDocuments.id, id))
      .returning();
    return document || undefined;
  }

  async deletePayrollDocument(id: string): Promise<boolean> {
    const result = await db.delete(payrollDocuments).where(eq(payrollDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPayrollItemsByDocumentId(documentId: string): Promise<PayrollItem[]> {
    return await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.documentId, documentId))
      .orderBy(asc(payrollItems.employeeId));
  }

  async getPayrollItem(id: string): Promise<PayrollItem | undefined> {
    const [item] = await db.select().from(payrollItems).where(eq(payrollItems.id, id));
    return item || undefined;
  }

  async getPayrollItemByDocumentAndEmployee(documentId: string, employeeId: string): Promise<PayrollItem | undefined> {
    const [item] = await db
      .select()
      .from(payrollItems)
      .where(and(eq(payrollItems.documentId, documentId), eq(payrollItems.employeeId, employeeId)));
    return item || undefined;
  }

  async createPayrollItem(insertItem: InsertPayrollItem): Promise<PayrollItem> {
    const [item] = await db
      .insert(payrollItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updatePayrollItem(id: string, updateItem: UpdatePayrollItem): Promise<PayrollItem | undefined> {
    const [item] = await db
      .update(payrollItems)
      .set({
        ...updateItem,
        updatedAt: new Date()
      })
      .where(eq(payrollItems.id, id))
      .returning();
    return item || undefined;
  }

  async deletePayrollItem(id: string): Promise<boolean> {
    const result = await db.delete(payrollItems).where(eq(payrollItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deletePayrollItemsByDocumentId(documentId: string): Promise<boolean> {
    const result = await db.delete(payrollItems).where(eq(payrollItems.documentId, documentId));
    return (result.rowCount ?? 0) >= 0; // Return true even if 0 rows deleted (document might have no items)
  }

  async generatePayrollItems(documentId: string, force: boolean = false): Promise<PayrollItem[]> {
    try {
      console.log('Starting payroll generation for document:', documentId);
      
      // Get document to check year and month
      const document = await this.getPayrollDocument(documentId);
      if (!document) {
        throw new Error('Payroll document not found');
      }

      // Get all active employees
      const allEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.status, 'employed'));

      console.log('Found employees:', allEmployees.length);
      const generatedItems: PayrollItem[] = [];

      for (const employee of allEmployees) {
        try {
          console.log('Processing employee:', employee.fullName);
          
          // Check if payroll item already exists for this employee
          const existingItem = await this.getPayrollItemByDocumentAndEmployee(documentId, employee.id);
          if (existingItem && !force) {
            console.log('Payroll item already exists for employee:', employee.fullName);
            continue; // Skip if already exists and not forcing
          }
          
          // If force is true and item exists, delete the existing item first
          if (existingItem && force) {
            console.log('Force regeneration: deleting existing payroll item for employee:', employee.fullName);
            await this.deletePayrollItem(existingItem.id);
          }

          // Get employee's salary information and Master Salary Configuration
          const salary = await this.getEmployeeSalaryByEmployeeId(employee.id);
          const basicSalary = parseFloat(salary?.basicSalary || '1000'); // Default basic salary
          
          console.log('Employee basic salary:', basicSalary);

          // Get Master Salary Configuration if available
          let masterSalaryData = null;
          try {
            masterSalaryData = await this.getMasterSalaryData(employee.id);
            console.log('=== MASTER SALARY DATA CAPTURE ===');
            console.log('Employee:', employee.fullName);
            console.log('Employee ID:', employee.id);
            console.log('Raw Master Salary Data:');
            console.log(JSON.stringify(masterSalaryData, null, 2));
            
            if (masterSalaryData) {
              console.log('=== BREAKDOWN OF CAPTURED DATA ===');
              console.log('Basic Salary:', masterSalaryData.basicSalary);
              console.log('Salary Type:', masterSalaryData.salaryType);
              console.log('Additional Items:');
              masterSalaryData.additionalItems?.forEach((item: any, index: number) => {
                console.log(`  ${index + 1}. ${item.label} (${item.code}): RM ${item.amount}`);
              });
              console.log('Deductions:');
              if (masterSalaryData.deductions) {
                Object.keys(masterSalaryData.deductions).forEach(key => {
                  console.log(`  ${key}: RM ${masterSalaryData.deductions[key]}`);
                });
              }
              console.log('Contributions:');
              if (masterSalaryData.contributions) {
                Object.keys(masterSalaryData.contributions).forEach(key => {
                  console.log(`  ${key}: RM ${masterSalaryData.contributions[key]}`);
                });
              }
              console.log('Settings:');
              if (masterSalaryData.settings) {
                console.log('  EPF Employee Rate:', masterSalaryData.settings.epfEmployeeRate + '%');
                console.log('  EPF Employer Rate:', masterSalaryData.settings.epfEmployerRate + '%');
                console.log('  SOCSO Enabled:', masterSalaryData.settings.isSocsoEnabled);
                console.log('  EIS Enabled:', masterSalaryData.settings.isEisEnabled);
              }
              console.log('=== END BREAKDOWN ===');
            }
          } catch (error) {
            console.log('No Master Salary Configuration found for', employee.fullName, 'Error:', error.message);
          }

          // Process additional items from Master Salary Configuration
          const additionalItems = [];
          let fixedAllowanceAmount = 0;
          let overtimeAmount = 0;
          
          // Process additional items from Master Salary data
          if (masterSalaryData && masterSalaryData.additionalItems) {
            console.log('=== PROCESSING ADDITIONAL ITEMS ===');
            masterSalaryData.additionalItems.forEach((item: any) => {
              const amount = parseFloat(item.amount || 0);
              console.log(`Processing: ${item.label} (${item.code}) = RM ${amount}`);
              
              if (amount > 0.01) {
                console.log(`✓ Including ${item.label}: RM ${amount} (> 0.01)`);
                
                // Handle different types of additional items
                if (item.code === 'FIXED' || item.label === 'FIXED ALLOWANCE') {
                  fixedAllowanceAmount = amount;
                  console.log(`Set Fixed Allowance: RM ${fixedAllowanceAmount}`);
                } else {
                  additionalItems.push({
                    code: item.code,
                    label: item.label,
                    amount: amount.toString(),
                    flags: item.flags || {}
                  });
                  console.log(`Added to additional items: ${item.label}`);
                }
              } else {
                console.log(`✗ Skipping ${item.label}: RM ${amount} (≤ 0.01)`);
              }
            });
            console.log('=== END PROCESSING ADDITIONAL ITEMS ===');
          }

          // Get overtime amount from actual calculation
          try {
            const overtimeResult = await this.calculateEmployeeOvertimeAmount(employee.id, 2025, 8); // Using current month
            overtimeAmount = parseFloat(overtimeResult.overtimeAmount || 0);
            console.log('=== OVERTIME CALCULATION ===');
            console.log('Employee:', employee.fullName);
            console.log('Calculated Overtime Amount:', overtimeAmount);
            
            if (overtimeAmount > 0.01) {
              console.log('✓ Including Overtime in payroll');
            } else {
              console.log('✗ No overtime to include');
            }
            console.log('=== END OVERTIME CALCULATION ===');
          } catch (error) {
            console.log('Error calculating overtime for', employee.fullName, ':', error.message);
            overtimeAmount = 0;
          }

          const deductionItems = {};
          const contributions = {};
          const claimsData = []; // Simplified for now
          const unpaidLeaveData = { days: 0, amount: 0 }; // Simplified for now

          // Calculate the deductions and contributions from master salary data
          const finalDeductions = this.generateDeductionsFromMasterSalary(basicSalary, masterSalaryData);
          const finalContributions = this.generateContributionsFromMasterSalary(basicSalary, masterSalaryData);

          // Create payroll item with MASTER SALARY SNAPSHOT captured
          const payrollItemData: InsertPayrollItem = {
        documentId,
        employeeId: employee.id,
        employeeSnapshot: JSON.stringify({
          name: employee.fullName,
          nric: employee.nric,
          staffId: employee.staffId,
          position: 'Employee' // Could be enhanced with actual position
        }),
        masterSalarySnapshot: JSON.stringify(masterSalaryData), // CAPTURE MASTER SALARY SNAPSHOT
        salary: JSON.stringify({
          basic: basicSalary.toString(),
          computed: basicSalary.toString(),
          fixedAllowance: fixedAllowanceAmount.toString(),
          additional: additionalItems || [],
          gross: this.calculateGrossSalary(basicSalary, additionalItems, fixedAllowanceAmount, overtimeAmount)
        }),
        overtime: JSON.stringify({
          hours: overtimeAmount > 0 ? 1 : 0, // Simplified hours calculation
          amount: overtimeAmount.toString(),
          calcNote: 'Calculated from approved overtime claims'
        }),
        claims: JSON.stringify(claimsData),
        unpaidLeave: JSON.stringify(unpaidLeaveData),
        lateness: JSON.stringify({ minutes: 0, amount: 0 }), // To be implemented
        deductions: JSON.stringify(finalDeductions),
        contributions: JSON.stringify(finalContributions),
        netPay: this.calculateNetPay(
          { amount: basicSalary.toString() }, 
          additionalItems, 
          [], 
          { amount: overtimeAmount.toString() },
          fixedAllowanceAmount
        ),
        audit: JSON.stringify({
          generatedAt: new Date().toISOString(),
          generatedBy: 'system',
          recalcAt: []
        })
      };

          console.log('=== FINAL PAYROLL ITEM DATA ===');
          console.log('Employee:', employee.fullName);
          console.log('Employee Snapshot:', JSON.parse(payrollItemData.employeeSnapshot));
          console.log('Master Salary Snapshot Captured:', payrollItemData.masterSalarySnapshot ? 'YES' : 'NO');
          if (payrollItemData.masterSalarySnapshot) {
            console.log('Master Salary Snapshot Content:', JSON.parse(payrollItemData.masterSalarySnapshot));
          }
          console.log('Salary Data:', JSON.parse(payrollItemData.salary));
          console.log('Final Deductions:', finalDeductions);
          console.log('Final Contributions:', finalContributions);
          console.log('Net Pay:', payrollItemData.netPay);
          console.log('=== END FINAL PAYROLL DATA ===');

          const createdItem = await this.createPayrollItem(payrollItemData);
          generatedItems.push(createdItem);
          console.log('Successfully created payroll item for:', employee.fullName);
          
        } catch (employeeError) {
          console.error('Error processing employee:', employee.fullName, employeeError);
          // Continue with next employee instead of failing entire process
        }
      }

      console.log('Payroll generation completed. Generated items:', generatedItems.length);
      return generatedItems;
      
    } catch (error) {
      console.error('Error in generatePayrollItems:', error);
      throw new Error(`Failed to generate payroll items: ${error.message}`);
    }
  }

  private calculateGrossSalary(basicSalary: number, additionalItems: any[], fixedAllowance: number = 0, overtime: number = 0): string {
    const totalAdditional = additionalItems.reduce((sum, item) => {
      return sum + parseFloat(item.amount || '0');
    }, 0);
    
    const grossSalary = basicSalary + totalAdditional + fixedAllowance + overtime;
    console.log('=== GROSS SALARY CALCULATION ===');
    console.log('Basic Salary:', basicSalary);
    console.log('Additional Items Total:', totalAdditional);
    console.log('Fixed Allowance:', fixedAllowance);
    console.log('Overtime:', overtime);
    console.log('Gross Salary:', grossSalary);
    console.log('=== END GROSS SALARY CALCULATION ===');
    
    return grossSalary.toFixed(2);
  }

  // Helper methods for payroll calculations

  private generateDeductionsFromMasterSalary(basicSalary: number, masterSalaryData: any): any {
    // If no Master Salary data, use default calculations
    if (!masterSalaryData || !masterSalaryData.deductions) {
      return {
        epfEmployee: this.calculateEPFEmployee(basicSalary.toString()),
        socsoEmployee: this.calculateSOCSO(basicSalary.toString(), 'employee'),
        eisEmployee: this.calculateEIS(basicSalary.toString(), 'employee'),
        pcb38: '0',
        pcb39: '0',
        zakat: '0',
        other: []
      };
    }

    // Use Master Salary Configuration deductions
    const deductions = masterSalaryData.deductions;
    console.log('Using Master Salary deductions for employee:', deductions);
    
    // Build deductions object from master salary data
    const result = {
      epfEmployee: deductions.epfEmployee?.toString() || this.calculateEPFEmployee(basicSalary.toString()),
      socsoEmployee: deductions.socsoEmployee?.toString() || this.calculateSOCSO(basicSalary.toString(), 'employee'),
      eisEmployee: deductions.eisEmployee?.toString() || this.calculateEIS(basicSalary.toString(), 'employee'),
      pcb38: deductions.pcb38?.toString() || '0',
      pcb39: deductions.pcb39?.toString() || '0',
      zakat: deductions.zakat?.toString() || '0',
      // CRITICAL FIX: Use the direct 'other' value from Master Salary for MTD/PCB
      // The 'other' field contains the MTD/PCB calculation result
      other: deductions.other?.toString() || '0'
    };

    console.log('Generated deductions from Master Salary:', result);
    return result;
  }

  private generateContributionsFromMasterSalary(basicSalary: number, masterSalaryData: any): any {
    console.log('=== GENERATE CONTRIBUTIONS FROM MASTER SALARY ===');
    console.log('Basic Salary:', basicSalary);
    console.log('Master Salary Data:', masterSalaryData);

    // Default calculations if no Master Salary data
    if (!masterSalaryData || !masterSalaryData.contributions) {
      console.log('No Master Salary contributions found, using defaults');
      return {
        epfEmployer: this.calculateEPFEmployer(basicSalary.toString()),
        socsoEmployer: this.calculateSOCSO(basicSalary.toString(), 'employer'),
        eisEmployer: this.calculateEIS(basicSalary.toString(), 'employer'),
        hrdf: '0',
        other: []
      };
    }

    // Use Master Salary Configuration contributions
    const contributions = masterSalaryData.contributions;
    console.log('Using Master Salary contributions:', contributions);
    
    // Build contributions object from master salary data
    const result = {
      epfEmployer: contributions.epfEmployer?.toString() || this.calculateEPFEmployer(basicSalary.toString()),
      socsoEmployer: contributions.socsoEmployer?.toString() || this.calculateSOCSO(basicSalary.toString(), 'employer'),
      eisEmployer: contributions.eisEmployer?.toString() || this.calculateEIS(basicSalary.toString(), 'employer'),
      hrdf: contributions.hrdf?.toString() || '0', // Capture HRDF from Master Salary
      other: (contributions.customItems || []).map((item: any) => ({
        name: item.name || item.label || 'Other Contribution',
        amount: item.amount?.toString() || '0'
      }))
    };

    console.log('Generated contributions from Master Salary:', result);
    console.log('HRDF value captured:', result.hrdf);
    console.log('=== END GENERATE CONTRIBUTIONS ===');
    return result;
  }

  private calculateEPFEmployee(basicSalary: string): string {
    const basic = parseFloat(basicSalary);
    if (basic <= 20) return '0.00';
    const epf = Math.min(basic * 0.11, 660); // 11% employee contribution, max RM660
    return epf.toFixed(2);
  }

  private calculateEPFEmployer(basicSalary: string): string {
    const basic = parseFloat(basicSalary);
    if (basic <= 20) return '0.00';
    const epf = Math.min(basic * 0.12, 720); // 12% employer contribution, max RM720
    return epf.toFixed(2);
  }

  private calculateSOCSO(basicSalary: string, type: 'employee' | 'employer'): string {
    const basic = parseFloat(basicSalary);
    if (basic > 4000) return '0.00'; // SOCSO ceiling
    
    // Simplified SOCSO calculation
    const rate = type === 'employee' ? 0.005 : 0.0175; // 0.5% employee, 1.75% employer
    return (basic * rate).toFixed(2);
  }

  private calculateEIS(basicSalary: string, type: 'employee' | 'employer'): string {
    const basic = parseFloat(basicSalary);
    if (basic > 5000) return '0.00'; // EIS ceiling
    
    const rate = 0.002; // 0.2% each for employee and employer
    return (basic * rate).toFixed(2);
  }

  private calculateNetPay(basicEarning: any, additionalItems: any[], deductionItems: any[], overtime: any, fixedAllowance: number = 0): string {
    const basic = parseFloat(basicEarning?.amount || '0');
    const additional = additionalItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
    const deductions = deductionItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
    const overtimeAmount = parseFloat(overtime?.amount || '0');
    
    // Statutory deductions
    const epf = parseFloat(this.calculateEPFEmployee(basicEarning?.amount || '0'));
    const socso = parseFloat(this.calculateSOCSO(basicEarning?.amount || '0', 'employee'));
    const eis = parseFloat(this.calculateEIS(basicEarning?.amount || '0', 'employee'));
    
    const grossPay = basic + additional + overtimeAmount + fixedAllowance;
    const totalDeductions = deductions + epf + socso + eis;
    
    console.log('=== NET PAY CALCULATION ===');
    console.log('Basic:', basic);
    console.log('Additional:', additional);  
    console.log('Overtime:', overtimeAmount);
    console.log('Fixed Allowance:', fixedAllowance);
    console.log('Gross Pay:', grossPay);
    console.log('Total Deductions:', totalDeductions);
    console.log('Net Pay:', grossPay - totalDeductions);
    console.log('=== END NET PAY CALCULATION ===');
    
    return (grossPay - totalDeductions).toFixed(2);
  }

  private async calculateEmployeeOvertime(employeeId: string, year: number, month: number): Promise<number> {
    // Get approved overtime claims for the month
    const claims = await db
      .select()
      .from(overtimeClaims)
      .where(
        and(
          eq(overtimeClaims.employeeId, employeeId),
          eq(overtimeClaims.status, 'approved'),
          sql`EXTRACT(YEAR FROM ${overtimeClaims.overtimeDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${overtimeClaims.overtimeDate}) = ${month}`
        )
      );

    // Calculate total overtime amount
    const totalAmount = claims.reduce((sum, claim) => {
      return sum + parseFloat(claim.totalAmount || '0');
    }, 0);

    return totalAmount;
  }

  private async getApprovedOvertimeClaimsForMonth(employeeId: string, year: number, month: number): Promise<{ hours: number; amount: number }> {
    const claims = await db
      .select()
      .from(claimApplications)
      .where(
        and(
          eq(claimApplications.employeeId, employeeId),
          eq(claimApplications.status, 'Approved'),
          eq(claimApplications.claimType, 'overtime'),
          sql`EXTRACT(YEAR FROM ${claimApplications.claimDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${claimApplications.claimDate}) = ${month}`
        )
      );

    const totalHours = claims.reduce((sum, claim) => sum + parseFloat(claim.totalHours || '0'), 0);
    const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.calculatedAmount || '0'), 0);

    return { hours: totalHours, amount: totalAmount };
  }

  private async getApprovedFinancialClaimsForMonth(employeeId: string, year: number, month: number): Promise<any[]> {
    const claims = await db
      .select()
      .from(claimApplications)
      .where(
        and(
          eq(claimApplications.employeeId, employeeId),
          eq(claimApplications.status, 'Approved'),
          eq(claimApplications.claimType, 'financial'),
          sql`EXTRACT(YEAR FROM ${claimApplications.claimDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${claimApplications.claimDate}) = ${month}`
        )
      );

    return claims.map(claim => ({
      id: claim.id,
      type: claim.claimCategory,
      amount: claim.amount,
      description: claim.particulars
    }));
  }

  private async calculateUnpaidLeave(employeeId: string, year: number, month: number): Promise<{ days: number; amount: number }> {
    // Get unpaid leave applications for the month
    const leaves = await db
      .select()
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.employeeId, employeeId),
          eq(leaveApplications.status, 'Approved'),
          eq(leaveApplications.leaveType, 'Unpaid Leave'),
          sql`EXTRACT(YEAR FROM ${leaveApplications.startDate}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${leaveApplications.startDate}) = ${month}`
        )
      );

    const totalDays = leaves.reduce((sum, leave) => sum + parseFloat(leave.totalDays || '0'), 0);
    
    // Get basic salary to calculate deduction  
    const salary = await this.getEmployeeSalaryByEmployeeId(employeeId);
    const basicSalary = parseFloat(salary?.basicSalary || '0');
    const dailyRate = basicSalary / 26; // Assuming 26 working days
    const deductionAmount = totalDays * dailyRate;

    return { days: totalDays, amount: deductionAmount };
  }

  // Approve payroll document
  async approvePayrollDocument(documentId: string, approverId: string): Promise<boolean> {
    const [updatedDocument] = await db
      .update(payrollDocuments)
      .set({
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(payrollDocuments.id, documentId))
      .returning();

    return !!updatedDocument;
  }

  // Reject payroll document
  async rejectPayrollDocument(documentId: string, rejectorId: string, reason: string): Promise<boolean> {
    const [updatedDocument] = await db
      .update(payrollDocuments)
      .set({
        status: 'Rejected',
        rejectedBy: rejectorId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(payrollDocuments.id, documentId))
      .returning();

    return !!updatedDocument;
  }

  // Submit payment for payroll document (set status to "sent")
  async submitPaymentPayrollDocument(documentId: string, submitterId: string): Promise<boolean> {
    try {
      // Update document status
      const [updatedDocument] = await db
        .update(payrollDocuments)
        .set({
          status: 'sent',
          updatedAt: new Date()
        })
        .where(eq(payrollDocuments.id, documentId))
        .returning();

      if (!updatedDocument) {
        return false;
      }

      // Get all payroll items for this document
      const payrollItemsData = await db
        .select({
          payrollItem: payrollItems,
          employee: employees,
          user: users
        })
        .from(payrollItems)
        .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
        .innerJoin(users, eq(employees.userId, users.id))
        .where(eq(payrollItems.documentId, documentId));

      // Create user payroll records for each employee
      const userRecords = payrollItemsData.map(({ payrollItem, employee, user }) => ({
        userId: user.id,
        employeeId: employee.id,
        year: updatedDocument.year,
        month: updatedDocument.month,
        payrollDate: updatedDocument.payrollDate,
        status: 'sent' as const,
        remarks: `Payroll submitted on ${new Date().toLocaleDateString('en-MY')}`,
        documentId: documentId,
        payrollItemId: payrollItem.id,
        submittedBy: submitterId
      }));

      // Insert user records (ignore conflicts if already exist)
      if (userRecords.length > 0) {
        await db
          .insert(userPayrollRecords)
          .values(userRecords)
          .onConflictDoNothing();
      }

      return true;
    } catch (error) {
      console.error('Error submitting payment:', error);
      return false;
    }
  }

  // Get user payroll records for My Record page
  async getUserPayrollRecords(userId: string): Promise<{
    id: string;
    userId: string;
    employeeId: string;
    employeeName: string;
    payrollItemId: string | null;
    documentId: string | null;
    month: number;
    year: number;
    submittedAt: Date;
    createdAt: Date;
  }[]> {
    try {
      const records = await db
        .select({
          id: userPayrollRecords.id,
          userId: userPayrollRecords.userId,
          employeeId: userPayrollRecords.employeeId,
          employeeName: employees.fullName,
          payrollItemId: userPayrollRecords.payrollItemId,
          documentId: userPayrollRecords.documentId,
          month: userPayrollRecords.month,
          year: userPayrollRecords.year,
          submittedAt: userPayrollRecords.submittedAt,
          createdAt: userPayrollRecords.createdAt
        })
        .from(userPayrollRecords)
        .innerJoin(employees, eq(userPayrollRecords.employeeId, employees.id))
        .where(eq(userPayrollRecords.userId, userId))
        .orderBy(desc(userPayrollRecords.year), desc(userPayrollRecords.month));
      
      return records;
    } catch (error) {
      console.error('Error fetching user payroll records:', error);
      return [];
    }
  }

  // =================== COMPANY SETTINGS METHODS ===================
  async getCompanySettings(): Promise<CompanySetting | undefined> {
    try {
      const [settings] = await db.select().from(companySettings).limit(1);
      return settings || undefined;
    } catch (error) {
      console.error('Error fetching company settings:', error);
      return undefined;
    }
  }

  async createCompanySettings(settings: InsertCompanySetting): Promise<CompanySetting> {
    try {
      const [newSettings] = await db
        .insert(companySettings)
        .values(settings)
        .returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating company settings:', error);
      throw error;
    }
  }

  async updateCompanySettings(id: string, settings: UpdateCompanySetting): Promise<CompanySetting | undefined> {
    try {
      const [updatedSettings] = await db
        .update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.id, id))
        .returning();
      return updatedSettings || undefined;
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  // =================== PAYMENT VOUCHER METHODS ===================
  async getAllPaymentVouchers(): Promise<PaymentVoucher[]> {
    try {
      return await db.select().from(paymentVouchers).orderBy(desc(paymentVouchers.createdAt));
    } catch (error) {
      console.error('Error fetching payment vouchers:', error);
      throw error;
    }
  }

  async getPaymentVoucher(id: string): Promise<PaymentVoucher | undefined> {
    try {
      const [voucher] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id));
      return voucher || undefined;
    } catch (error) {
      console.error('Error fetching payment voucher:', error);
      throw error;
    }
  }

  async createPaymentVoucher(voucher: InsertPaymentVoucher): Promise<PaymentVoucher> {
    try {
      const [newVoucher] = await db
        .insert(paymentVouchers)
        .values(voucher)
        .returning();
      return newVoucher;
    } catch (error) {
      console.error('Error creating payment voucher:', error);
      throw error;
    }
  }

  async updatePaymentVoucher(id: string, voucher: UpdatePaymentVoucher): Promise<PaymentVoucher | undefined> {
    try {
      const [updatedVoucher] = await db
        .update(paymentVouchers)
        .set({ ...voucher, updatedAt: new Date() })
        .where(eq(paymentVouchers.id, id))
        .returning();
      return updatedVoucher || undefined;
    } catch (error) {
      console.error('Error updating payment voucher:', error);
      throw error;
    }
  }

  async deletePaymentVoucher(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(paymentVouchers)
        .where(eq(paymentVouchers.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting payment voucher:', error);
      throw error;
    }
  }

  async generateVoucherNumber(): Promise<string> {
    try {
      // Get the latest voucher number
      const [latestVoucher] = await db
        .select({ voucherNumber: paymentVouchers.voucherNumber })
        .from(paymentVouchers)
        .orderBy(desc(paymentVouchers.createdAt))
        .limit(1);

      if (!latestVoucher) {
        return 'PV001UMG';
      }

      // Extract number from PV001UMG format
      const match = latestVoucher.voucherNumber.match(/PV(\d+)UMG/);
      if (!match) {
        return 'PV001UMG';
      }

      const currentNumber = parseInt(match[1], 10);
      const nextNumber = currentNumber + 1;
      
      // Format with leading zeros (3 digits)
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      
      return `PV${formattedNumber}UMG`;
    } catch (error) {
      console.error('Error generating voucher number:', error);
      return 'PV001UMG';
    }
  }

  async getApprovedFinancialClaims(year: number, month: number): Promise<ClaimApplication[]> {
    try {
      return await db
        .select()
        .from(claimApplications)
        .where(
          and(
            eq(claimApplications.claimType, 'financial'),
            eq(claimApplications.status, 'Approved'),
            sql`EXTRACT(YEAR FROM ${claimApplications.claimDate}) = ${year}`,
            sql`EXTRACT(MONTH FROM ${claimApplications.claimDate}) = ${month}`
          )
        )
        .orderBy(asc(claimApplications.employeeId));
    } catch (error) {
      console.error('Error fetching approved financial claims:', error);
      throw error;
    }
  }

  // =================== CLAIM APPLICATION METHODS ===================

  async createClaimApplication(data: InsertClaimApplication): Promise<ClaimApplication> {
    try {
      const [claimApplication] = await db
        .insert(claimApplications)
        .values(data)
        .returning();
      return claimApplication;
    } catch (error) {
      console.error('Error creating claim application:', error);
      throw error;
    }
  }

  async getClaimApplicationsByEmployee(
    employeeId: string, 
    filters?: { month?: number; year?: number; status?: string }
  ): Promise<ClaimApplication[]> {
    try {
      let query = db
        .select()
        .from(claimApplications)
        .where(eq(claimApplications.employeeId, employeeId));

      const conditions = [eq(claimApplications.employeeId, employeeId)];

      if (filters?.month) {
        conditions.push(sql`EXTRACT(MONTH FROM ${claimApplications.claimDate}) = ${filters.month}`);
      }

      if (filters?.year) {
        conditions.push(sql`EXTRACT(YEAR FROM ${claimApplications.claimDate}) = ${filters.year}`);
      }

      if (filters?.status) {
        conditions.push(eq(claimApplications.status, filters.status));
      }

      const result = await db
        .select()
        .from(claimApplications)
        .where(and(...conditions))
        .orderBy(desc(claimApplications.dateSubmitted));

      return result;
    } catch (error) {
      console.error('Error fetching claim applications by employee:', error);
      throw error;
    }
  }

  // Get all claim applications with employee details (for admin users)
  async getAllClaimApplicationsWithDetails(
    filters?: { month?: number; year?: number; status?: string }
  ): Promise<any[]> {
    try {
      const conditions = [];

      if (filters?.month) {
        conditions.push(sql`EXTRACT(MONTH FROM ${claimApplications.claimDate}) = ${filters.month}`);
      }

      if (filters?.year) {
        conditions.push(sql`EXTRACT(YEAR FROM ${claimApplications.claimDate}) = ${filters.year}`);
      }

      if (filters?.status) {
        conditions.push(eq(claimApplications.status, filters.status));
      }

      // Build the query without complex select mapping first
      let query = db
        .select()
        .from(claimApplications)
        .leftJoin(employees, eq(claimApplications.employeeId, employees.id));

      const rawResult = conditions.length > 0 
        ? await query.where(and(...conditions)).orderBy(desc(claimApplications.dateSubmitted))
        : await query.orderBy(desc(claimApplications.dateSubmitted));

      // Map the result manually to avoid Drizzle select issues
      const result = rawResult.map((row: any) => ({
        id: row.claim_applications?.id,
        employeeId: row.claim_applications?.employee_id,
        claimType: row.claim_applications?.claim_type,
        claimCategory: row.claim_applications?.claim_category,
        status: row.claim_applications?.status,
        amount: row.claim_applications?.amount,
        description: row.claim_applications?.description,
        receiptUrl: row.claim_applications?.receipt_url,
        claimDate: row.claim_applications?.claim_date ? new Date(row.claim_applications.claim_date).toISOString() : null,
        dateSubmitted: row.claim_applications?.date_submitted ? new Date(row.claim_applications.date_submitted).toISOString() : null,
        requestorName: row.employees?.full_name || 'Unknown Employee',
      }));

      return result;
    } catch (error) {
      console.error('Error fetching all claim applications:', error);
      throw error;
    }
  }

  async getClaimApplicationsForApproval(filters: {
    status?: string;
    claimType?: string;
    page: number;
    limit: number;
  }): Promise<{ claims: ClaimApplication[]; total: number }> {
    try {
      const conditions = [];

      if (filters.status) {
        conditions.push(eq(claimApplications.status, filters.status));
      }

      if (filters.claimType) {
        conditions.push(eq(claimApplications.claimType, filters.claimType));
      }

      const offset = (filters.page - 1) * filters.limit;

      const [claims, totalResult] = await Promise.all([
        db
          .select()
          .from(claimApplications)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(claimApplications.dateSubmitted))
          .limit(filters.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(claimApplications)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
      ]);

      return {
        claims,
        total: totalResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching claim applications for approval:', error);
      throw error;
    }
  }

  async approveClaimApplication(
    claimId: string,
    approverId: string,
    level: 'first' | 'final'
  ): Promise<ClaimApplication | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      };

      if (level === 'first') {
        updateData.status = 'First Level Approved';
        updateData.firstLevelApproverId = approverId;
      } else {
        updateData.status = 'Approved';
        updateData.approvedBy = approverId;
        updateData.approvedAt = new Date();
      }

      const [updatedClaim] = await db
        .update(claimApplications)
        .set(updateData)
        .where(eq(claimApplications.id, claimId))
        .returning();

      return updatedClaim || null;
    } catch (error) {
      console.error('Error approving claim application:', error);
      throw error;
    }
  }

  async rejectClaimApplication(
    claimId: string,
    rejectedById: string,
    reason?: string
  ): Promise<ClaimApplication | null> {
    try {
      const [updatedClaim] = await db
        .update(claimApplications)
        .set({
          status: 'Rejected',
          rejectedBy: rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason,
          updatedAt: new Date()
        })
        .where(eq(claimApplications.id, claimId))
        .returning();

      return updatedClaim || null;
    } catch (error) {
      console.error('Error rejecting claim application:', error);
      throw error;
    }
  }

  async getRecentClaimApplications(claimType: string, limit: number): Promise<ClaimApplication[]> {
    try {
      return await db
        .select()
        .from(claimApplications)
        .where(eq(claimApplications.claimType, claimType))
        .orderBy(desc(claimApplications.dateSubmitted))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching recent claim applications:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
