import jsPDF from 'jspdf';

interface EmployeeWithDetails {
  id: string;
  fullName: string;
  role: string | null;
  status: string;
  employment?: {
    designation: string | null;
    department: string | null;
  };
  contact?: {
    phoneNumber: string | null;
    mobileNumber: string | null;
    email: string | null;
    personalEmail: string | null;
  };
}

export class EmployeePDFGenerator {
  async generateEmployeeReport(employees: EmployeeWithDetails[]): Promise<Buffer> {
    console.log(`🔄 Generating PDF report for ${employees.length} employees`);
    
    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(20);
    doc.text('LAPORAN MAKLUMAT PEKERJA', 105, 20, { align: 'center' });
    doc.text('UTAMAHR SISTEM', 105, 30, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    const today = new Date().toLocaleDateString('ms-MY');
    doc.text(`Tarikh: ${today}`, 20, 45);
    
    let yPosition = 60;
    
    // Add employee data
    employees.forEach((employee, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Employee header
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${employee.fullName || 'Tiada Nama'}`, 20, yPosition);
      yPosition += 10;
      
      // Employee details
      doc.setFontSize(10);
      doc.text(`NRIC: ${employee.nric || 'Tiada Data'}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Staff ID: ${employee.staffId || 'Tiada Data'}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Role: ${employee.role || 'Tiada Data'}`, 25, yPosition);
      yPosition += 6;
      
      if (employee.employment) {
        doc.text(`Syarikat: ${employee.employment.company || 'Tiada Data'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Jabatan: ${employee.employment.department || 'Tiada Data'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Jawatan: ${employee.employment.designation || 'Tiada Data'}`, 25, yPosition);
        yPosition += 6;
      }
      
      if (employee.contact) {
        doc.text(`Email: ${employee.contact.email || 'Tiada Data'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`No Telefon: ${employee.contact.phoneNumber || 'Tiada Data'}`, 25, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10; // Space between employees
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Halaman ${i} daripada ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Dijana oleh UtamaHR Sistem', 105, 290, { align: 'center' });
    }
    
    // Return PDF as buffer
    const pdfOutput = doc.output('arraybuffer');
    console.log(`✅ PDF report generated successfully`);
    
    return Buffer.from(pdfOutput);
  }

}