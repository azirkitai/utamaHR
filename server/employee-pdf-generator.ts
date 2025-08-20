import { jsPDF } from 'jspdf';

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

    // Add title and header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN MAKLUMAT PEKERJA', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('UTAMAHR SISTEM', 105, 22, { align: 'center' });
    
    // Add date and summary
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('ms-MY');
    doc.text(`Tarikh: ${today}`, 20, 32);
    doc.text(`Jumlah Pekerja: ${employees.length}`, 150, 32);
    
    // Draw table headers
    const startY = 42;
    const rowHeight = 8;
    const colWidths = [15, 40, 25, 30, 30, 35, 25]; // Column widths
    const colX = [10, 25, 65, 90, 120, 150, 185]; // X positions for columns
    
    // Table headers
    doc.setFillColor(30, 64, 175); // Blue background
    doc.rect(10, startY, 200, rowHeight, 'F'); // Header background
    
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Header texts
    doc.text('No.', colX[0] + 2, startY + 5);
    doc.text('Nama Penuh', colX[1] + 2, startY + 5);
    doc.text('Staff ID', colX[2] + 2, startY + 5);
    doc.text('Jawatan', colX[3] + 2, startY + 5);
    doc.text('Jabatan', colX[4] + 2, startY + 5);
    doc.text('Email', colX[5] + 2, startY + 5);
    doc.text('Telefon', colX[6] + 2, startY + 5);
    
    // Reset text color for content
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let currentY = startY + rowHeight;
    
    // Add employee data in table format
    employees.forEach((employee, index) => {
      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage();
        
        // Redraw headers on new page
        doc.setFillColor(30, 64, 175);
        doc.rect(10, 20, 200, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        doc.text('No.', colX[0] + 2, 25);
        doc.text('Nama Penuh', colX[1] + 2, 25);
        doc.text('Staff ID', colX[2] + 2, 25);
        doc.text('Jawatan', colX[3] + 2, 25);
        doc.text('Jabatan', colX[4] + 2, 25);
        doc.text('Email', colX[5] + 2, 25);
        doc.text('Telefon', colX[6] + 2, 25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        currentY = 28;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // Light gray
        doc.rect(10, currentY, 200, rowHeight, 'F');
      }
      
      // Draw cell borders
      for (let i = 0; i < colX.length; i++) {
        const width = i < colX.length - 1 ? colX[i + 1] - colX[i] : 210 - colX[i];
        doc.rect(colX[i], currentY, width, rowHeight);
      }
      
      // Add employee data
      const truncateText = (text: string, maxLength: number) => {
        return text && text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text || '-';
      };
      
      doc.text(String(index + 1), colX[0] + 2, currentY + 5);
      doc.text(truncateText(employee.fullName || 'Tiada Nama', 18), colX[1] + 2, currentY + 5);
      doc.text(truncateText(employee.staffId || '-', 12), colX[2] + 2, currentY + 5);
      doc.text(truncateText(employee.employment?.designation || '-', 14), colX[3] + 2, currentY + 5);
      doc.text(truncateText(employee.employment?.department || '-', 14), colX[4] + 2, currentY + 5);
      doc.text(truncateText(employee.contact?.email || '-', 16), colX[5] + 2, currentY + 5);
      doc.text(truncateText(employee.contact?.phoneNumber || '-', 12), colX[6] + 2, currentY + 5);
      
      currentY += rowHeight;
    });
    
    // Add summary section at the bottom
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ringkasan: Jumlah ${employees.length} pekerja dalam laporan ini`, 20, currentY + 5);
    
    const activeCount = employees.filter(emp => emp.status === 'employed').length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`- Pekerja Aktif: ${activeCount}`, 25, currentY + 12);
    doc.text(`- Pekerja Tidak Aktif: ${employees.length - activeCount}`, 25, currentY + 18);
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Halaman ${i} daripada ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Dijana oleh UtamaHR Sistem', 105, 290, { align: 'center' });
      doc.text(`Tarikh: ${today}`, 105, 295, { align: 'center' });
    }
    
    // Return PDF as buffer
    const pdfOutput = doc.output('arraybuffer');
    console.log(`✅ PDF report generated successfully`);
    
    return Buffer.from(pdfOutput);
  }

}