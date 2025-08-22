import { jsPDF } from 'jspdf';
import { storage } from './storage';

interface EmployeeWithDetails {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  nric?: string;
  nricOld?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  staffId?: string;
  role: string;
  status: string;
  employment?: {
    company?: string;
    department?: string;
    designation?: string;
    employmentStatus?: string;
    dateJoining?: string;
    employeeNo?: string;
  };
  contact?: {
    email?: string;
    personalEmail?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    address?: string;
    mailingAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
  };
  payroll?: {
    basicSalary?: number;
    bankName?: string;
    accountNumber?: string;
    epfNumber?: string;
    socsoNumber?: string;
    eisNumber?: string;
    pcbNumber?: string;
  };
}

export class EmployeePDFGenerator {
  static async generateEmployeeReport(employees: EmployeeWithDetails[]): Promise<Buffer> {
    console.log(`🔄 Generating comprehensive PDF report for ${employees.length} employees`);
    
    // Get company settings for logo and company info
    const companySettings = await storage.getCompanySettings();
    console.log('Company settings retrieved:', companySettings);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const today = new Date().toLocaleDateString('ms-MY');
    
    // Helper functions
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return 'N/A';
      if (typeof value === 'string' && value.trim() === '') return 'N/A';
      return String(value);
    };

    const formatDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString('ms-MY');
      } catch {
        return 'N/A';
      }
    };

    const addPageHeader = () => {
      // Simple header without logo
      
      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('COMPLETE EMPLOYEE REPORT', 105, 18, { align: 'center' });
      
      // Company system name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const systemName = companySettings?.companyShortName || 
        companySettings?.companyName || 
        'UTAMA 24 HOUR CLINIC HR SYSTEM';
      doc.text(systemName, 105, 28, { align: 'center' });
      
      // Header line
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      return 40; // Return Y position after header
    };

    const addSectionHeader = (title: string, yPos: number): number => {
      doc.setFillColor(240, 245, 255);
      doc.rect(20, yPos, 170, 6, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(title, 22, yPos + 4);
      return yPos + 8;
    };

    const addTableRow = (label: string, value: string | undefined | null, yPos: number, isEven: boolean = false): number => {
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPos, 170, 5, 'F');
      }
      
      // Draw borders
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(20, yPos, 60, 5); // Label column
      doc.rect(80, yPos, 110, 5); // Value column
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(label, 22, yPos + 3.5);
      doc.text(formatValue(value), 82, yPos + 3.5);
      
      return yPos + 5;
    };

    const addPageFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Laporan dijana oleh UtamaHR Sistem pada ${today}`, 105, 285, { align: 'center' });
      doc.text(`Page ${pageNum} of ${totalPages}`, 105, 290, { align: 'center' });
    };

    // Generate report for each employee
    employees.forEach((employee, index) => {
      if (index > 0) doc.addPage();
      
      let yPos = addPageHeader();
      
      // Employee header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`PEKERJA ${index + 1}: ${employee.fullName || 'Tiada Name'}`, 20, yPos);
      yPos += 10;
      
      // Section 1: Maklumat Peribadi
      yPos = addSectionHeader('1. MAKLUMAT PERIBADI', yPos);
      yPos = addTableRow('Name Penuh', employee.fullName, yPos, false);
      yPos = addTableRow('No. IC / NRIC', employee.nric || employee.nricOld, yPos, true);
      yPos = addTableRow('Date Lahir', formatDate(employee.dateOfBirth), yPos, false);
      yPos = addTableRow('Tempat Lahir', employee.placeOfBirth, yPos, true);
      yPos = addTableRow('Jantina', employee.gender, yPos, false);
      yPos = addTableRow('Alamat Tetap', employee.contact?.address, yPos, true);
      yPos = addTableRow('Alamat Surat-Menyurat', employee.contact?.mailingAddress, yPos, false);
      yPos += 5;

      // Section 2: Maklumat Employeean
      yPos = addSectionHeader('2. MAKLUMAT PEKERJAAN', yPos);
      yPos = addTableRow('Staff ID', employee.staffId, yPos, false);
      yPos = addTableRow('No. Employee', employee.employment?.employeeNo, yPos, true);
      yPos = addTableRow('Jawatan', employee.employment?.designation, yPos, false);
      yPos = addTableRow('Jabatan', employee.employment?.department, yPos, true);
      yPos = addTableRow('Company', employee.employment?.company, yPos, false);
      yPos = addTableRow('Status Employeean', employee.employment?.employmentStatus, yPos, true);
      yPos = addTableRow('Date Mula Kerja', formatDate(employee.employment?.dateJoining), yPos, false);
      yPos += 5;

      // Check if need new page
      if (yPos > 200) {
        doc.addPage();
        yPos = addPageHeader();
      }

      // Section 3: Maklumat Perhubungan
      yPos = addSectionHeader('3. CONTACT INFORMATION', yPos);
      yPos = addTableRow('Office Phone', employee.contact?.phoneNumber, yPos, false);
      yPos = addTableRow('Mobile Phone', employee.contact?.mobileNumber, yPos, true);
      yPos = addTableRow('Official Email', employee.contact?.email, yPos, false);
      yPos = addTableRow('Personal Email', employee.contact?.personalEmail, yPos, true);
      yPos += 5;

      // Section 4: Maklumat Kecemasan
      yPos = addSectionHeader('4. EMERGENCY INFORMATION', yPos);
      yPos = addTableRow('Name Untuk Dihubungi', employee.contact?.emergencyContactName, yPos, false);
      yPos = addTableRow('Emergency Phone Number', employee.contact?.emergencyContactPhone, yPos, true);
      yPos = addTableRow('Relationship', employee.contact?.emergencyContactRelationship, yPos, false);
      yPos += 5;

      // Section 5: Maklumat HR/Payroll
      yPos = addSectionHeader('5. MAKLUMAT HR/PAYROLL', yPos);
      yPos = addTableRow('Gaji Asas', employee.payroll?.basicSalary ? `RM ${employee.payroll.basicSalary.toFixed(2)}` : 'N/A', yPos, false);
      yPos = addTableRow('Name Bank', employee.payroll?.bankName, yPos, true);
      yPos = addTableRow('Bank Account Number', employee.payroll?.accountNumber, yPos, false);
      yPos = addTableRow('EPF Number', employee.payroll?.epfNumber, yPos, true);
      yPos = addTableRow('SOCSO Number', employee.payroll?.socsoNumber, yPos, false);
      yPos = addTableRow('EIS Number', employee.payroll?.eisNumber, yPos, true);
      yPos = addTableRow('PCB Number', employee.payroll?.pcbNumber, yPos, false);

      // Add status indicator
      yPos += 10;
      if (employee.status === 'employed') {
        doc.setFillColor(76, 175, 80); // Green for employed
      } else {
        doc.setFillColor(244, 67, 54); // Red for others
      }
      doc.rect(20, yPos, 170, 6, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`STATUS: ${employee.status?.toUpperCase() || 'UNKNOWN'}`, 105, yPos + 4, { align: 'center' });
    });

    // Add summary page
    doc.addPage();
    let yPos = addPageHeader();
    
    yPos = addSectionHeader('RINGKASAN LAPORAN', yPos);
    
    const activeCount = employees.filter(emp => emp.status === 'employed').length;
    const probationCount = employees.filter(emp => emp.employment?.employmentStatus === 'Probation').length;
    const resignedCount = employees.filter(emp => emp.status === 'resigned').length;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    yPos += 5;
    doc.text(`Jumlah Keseluruhan Employee: ${employees.length}`, 20, yPos);
    yPos += 8;
    doc.text(`Active Employee: ${activeCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Employee Dalam Percubaan: ${probationCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Employee Berhenti: ${resignedCount}`, 20, yPos);
    
    // Department breakdown
    const departments = employees.reduce((acc, emp) => {
      const dept = emp.employment?.department || 'Tiada Jabatan';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    yPos += 15;
    yPos = addSectionHeader('BREAKDOWN BY DEPARTMENT', yPos);
    yPos += 5;
    
    Object.entries(departments).forEach(([dept, count]) => {
      doc.text(`${dept}: ${count} people`, 20, yPos);
      yPos += 6;
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPageFooter(i, totalPages);
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('✅ Comprehensive PDF report generated successfully');
    return pdfBuffer;
  }
}