import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { storage } from './storage';
import { db } from './db';
import { companySettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface LeaveReportData {
  employees: Array<{
    employeeId: string;
    employeeName: string;
    leaveBreakdown: Record<string, {
      entitlementDays: number;
      daysTaken: number;
      remainingDays: number;
      isEligible: boolean;
    }>;
  }>;
  filters: {
    department?: string;
    year?: string;
  };
  reportTitle: string;
}

export async function generateLeaveReportPDF(data: LeaveReportData): Promise<Buffer> {
  try {
    // Get company settings for header
    const companyData = await db
      .select()
      .from(companySettings)
      .limit(1);
    
    const company = companyData[0] || {
      companyName: 'UtamaHR System',
      companyAddress: '',
      companyPhone: '',
      companyEmail: ''
    };

    // Create new PDF document
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Add header
    addPDFHeader(doc, company, data);
    
    // Add employee leave data
    addEmployeeLeaveData(doc, data);
    
    // Add footer
    addPDFFooter(doc);
    
    // Return PDF as buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    throw error;
  }
}

function addPDFHeader(doc: jsPDF, company: any, data: LeaveReportData) {
  const currentDate = new Date().toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  // Add company logo (simplified)
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(20, 15, 15, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('UH', 27.5, 25);

  // Company name and report title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName, 40, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175); // Blue
  doc.text(data.reportTitle, 40, 28);

  // Report info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dijana pada: ${currentDate}`, 40, 35);

  // Filters info
  const filterText = [];
  if (data.filters.department && data.filters.department !== 'all') {
    filterText.push(`Jabatan: ${data.filters.department}`);
  }
  if (data.filters.year) {
    filterText.push(`Tahun: ${data.filters.year}`);
  }
  if (filterText.length > 0) {
    doc.setTextColor(8, 145, 178); // Cyan
    doc.text(`Tapisan: ${filterText.join(' | ')}`, 40, 42);
  }

  // Add separator line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1);
  doc.line(20, 50, 190, 50);
}

function addEmployeeLeaveData(doc: jsPDF, data: LeaveReportData) {
  let yPosition = 60;

  data.employees.forEach((employee, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Employee header
    doc.setFillColor(15, 23, 42);
    doc.rect(20, yPosition, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(employee.employeeName, 25, yPosition + 8);

    const leaveTypes = Object.entries(employee.leaveBreakdown);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${leaveTypes.length} Jenis Cuti`, 165, yPosition + 8);

    yPosition += 15;

    // Prepare table data
    const tableData = leaveTypes.map(([leaveType, breakdown], idx) => {
      let status = 'Tersedia';
      if (!breakdown.isEligible) {
        status = 'Dikecualikan';
      } else if (breakdown.remainingDays === 0) {
        status = 'Habis';
      } else if (breakdown.remainingDays < 0) {
        status = 'Terlebih';
      }

      return [
        (idx + 1).toString(),
        leaveType,
        breakdown.entitlementDays.toString(),
        breakdown.daysTaken.toString(),
        breakdown.remainingDays.toString(),
        status
      ];
    });

    // Add table using autoTable
    (doc as any).autoTable({
      startY: yPosition,
      head: [['No.', 'Jenis Cuti', 'Kelayakan', 'Digunakan', 'Baki Semasa', 'Status']],
      body: tableData,
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [55, 65, 81],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 60 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 25 },
      },
      didParseCell: function(data: any) {
        // Style status cells
        if (data.column.index === 5) {
          const status = data.cell.text[0];
          if (status === 'Tersedia') {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          } else if (status === 'Habis') {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [153, 27, 27];
          } else if (status === 'Dikecualikan') {
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.textColor = [107, 114, 128];
          } else if (status === 'Terlebih') {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          }
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 5;

    // Add summary footer
    const totalEntitlement = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.entitlementDays || 0), 0);
    const totalUsed = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.daysTaken || 0), 0);
    const totalRemaining = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.remainingDays || 0), 0);

    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPosition, 170, 15, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Summary values
    doc.text(totalEntitlement.toString(), 50, yPosition + 8);
    doc.text(totalUsed.toString(), 100, yPosition + 8);
    doc.text(totalRemaining.toString(), 150, yPosition + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    
    doc.text('Jumlah Kelayakan', 35, yPosition + 12);
    doc.text('Jumlah Digunakan', 87, yPosition + 12);
    doc.text('Jumlah Baki', 140, yPosition + 12);

    yPosition += 25;
  });
}

function addPDFFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    const currentDate = new Date().toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Dijana pada: ${currentDate}`, 20, 285);
    doc.text(`Halaman ${i} dari ${pageCount}`, 150, 285);
  }
}

// HTML function removed - now using jsPDF directly