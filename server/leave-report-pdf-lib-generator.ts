import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface LeaveReportData {
  employees: Array<{
    employeeId: string;
    employeeName: string;
    leaveBreakdown: Record<string, {
      entitlementDays: number;
      takenDays: number;
      balanceDays: number;
      roleBasedExcluded?: boolean;
    }>;
  }>;
  filters: {
    department?: string;
    year?: string;
  };
  reportTitle: string;
}

export async function generateLeaveReportPDFLib(data: LeaveReportData, company: any): Promise<Buffer> {
  console.log('PDF generation with pdf-lib, input data:', {
    employeeCount: data.employees?.length || 0,
    filters: data.filters,
    reportTitle: data.reportTitle,
    sampleEmployee: data.employees?.[0] ? {
      name: data.employees[0].employeeName,
      leaveTypesCount: Object.keys(data.employees[0].leaveBreakdown || {}).length
    } : null
  });

  try {
    // Create a new PDF document like payment voucher
    console.log('Creating PDF document with pdf-lib...');
    const pdfDoc = await PDFDocument.create();
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add first page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const { width, height } = page.getSize();
    let yPosition = height - 60; // Start from top

    // Header - Company Info
    page.drawText(company?.name || 'SYARIKAT CONTOH SDN BHD', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    if (company?.address) {
      page.drawText(company.address, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    yPosition -= 20;

    // Title
    page.drawText(data.reportTitle || 'LAPORAN PERMOHONAN CUTI', {
      x: (width - 250) / 2,
      y: yPosition,
      size: 18,
      font: boldFont,
    });
    yPosition -= 40;

    // Report Info
    const currentDate = new Date().toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    
    page.drawText(`Dijana pada: ${currentDate}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    if (data.filters.year) {
      page.drawText(`Tahun: ${data.filters.year}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    if (data.filters.department && data.filters.department !== 'all') {
      page.drawText(`Jabatan: ${data.filters.department}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    yPosition -= 20;

    // Summary Box
    page.drawRectangle({
      x: 50,
      y: yPosition - 35,
      width: width - 100,
      height: 35,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText(`Jumlah Pekerja: ${data.employees?.length || 0}`, {
      x: 60,
      y: yPosition - 20,
      size: 12,
      font: boldFont,
    });

    yPosition -= 60;

    // Table headers
    if (data.employees && data.employees.length > 0) {
      const tableHeaders = ['Nama Pekerja', 'Jenis Cuti', 'Kelayakan', 'Diambil', 'Baki'];
      const columnWidths = [120, 140, 80, 80, 80];
      let currentX = 50;

      // Draw table header
      page.drawRectangle({
        x: 50,
        y: yPosition - 20,
        width: 500,
        height: 20,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(0.9, 0.9, 0.9),
      });

      tableHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: currentX + 5,
          y: yPosition - 15,
          size: 10,
          font: boldFont,
        });
        currentX += columnWidths[index];
      });

      yPosition -= 20;

      // Draw employee data
      let rowCount = 0;
      data.employees.forEach((employee) => {
        const leaveTypes = Object.entries(employee.leaveBreakdown);
        
        leaveTypes.forEach(([leaveType, breakdown], index) => {
          if (yPosition < 100) return; // Stop if near bottom of page
          
          currentX = 50;
          
          // Draw row border
          page.drawRectangle({
            x: 50,
            y: yPosition - 15,
            width: 500,
            height: 15,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
          });

          // Employee name (only for first row of each employee)
          if (index === 0) {
            const employeeName = employee.employeeName.length > 16 
              ? employee.employeeName.substring(0, 16) + "..."
              : employee.employeeName;
            page.drawText(employeeName, {
              x: currentX + 2,
              y: yPosition - 12,
              size: 8,
              font: font,
            });
          }
          currentX += columnWidths[0];

          // Leave Type
          const leaveTypeName = leaveType.length > 18 
            ? leaveType.substring(0, 18) + "..."
            : leaveType;
          page.drawText(leaveTypeName, {
            x: currentX + 2,
            y: yPosition - 12,
            size: 8,
            font: font,
          });
          currentX += columnWidths[1];

          // Entitlement
          page.drawText(breakdown.entitlementDays?.toString() || '0', {
            x: currentX + 2,
            y: yPosition - 12,
            size: 8,
            font: font,
          });
          currentX += columnWidths[2];

          // Taken
          page.drawText(breakdown.takenDays?.toString() || '0', {
            x: currentX + 2,
            y: yPosition - 12,
            size: 8,
            font: font,
          });
          currentX += columnWidths[3];

          // Balance
          page.drawText(breakdown.balanceDays?.toString() || '0', {
            x: currentX + 2,
            y: yPosition - 12,
            size: 8,
            font: font,
          });

          yPosition -= 15;
          rowCount++;
          
          if (rowCount >= 40) return; // Limit rows for first page
        });
      });
    } else {
      // No data message
      page.drawText('Tiada Data Pekerja Ditemui', {
        x: (width - 200) / 2,
        y: yPosition - 50,
        size: 14,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Footer
    page.drawText(`Dijana oleh Sistem HR pada ${new Date().toLocaleString('ms-MY')}`, {
      x: 50,
      y: 50,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Generate PDF buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    console.log('PDF generated successfully with pdf-lib, size:', pdfBuffer.length);
    
    // Write to file for debugging
    const fs = await import('fs');
    await fs.promises.writeFile('debug_leave_report_pdflib.pdf', pdfBuffer);
    console.log('Debug PDF saved to debug_leave_report_pdflib.pdf');
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF with pdf-lib:', error);
    throw error;
  }
}