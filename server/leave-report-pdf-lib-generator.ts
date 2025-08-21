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
    // Get company data from database first
    console.log('Fetching company data from database...');
    const { db } = await import('./db');
    const { companySettings } = await import('../shared/schema');
    
    const [companyData] = await db.select().from(companySettings).limit(1);
    console.log('Company data fetched:', companyData);
    
    // Create a new PDF document
    console.log('Creating professional PDF document with pdf-lib...');
    const pdfDoc = await PDFDocument.create();
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Process each employee on separate page
    if (!data.employees || data.employees.length === 0) {
      // Create a page for no data message
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const { width, height } = page.getSize();
      
      page.drawText('Tiada Data Pekerja Ditemui', {
        x: (width - 200) / 2,
        y: height / 2,
        size: 16,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
    } else {
      // Create one page per employee
      for (let empIndex = 0; empIndex < data.employees.length; empIndex++) {
        const employee = data.employees[empIndex];
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
        const { width, height } = page.getSize();
        let yPosition = height - 40; // Start from top
        
        // === HEADER SECTION ===
        // Company Name - larger and bold
        page.drawText(companyData?.name || 'UTAMA MEDGROUP SDN BHD', {
          x: 50,
          y: yPosition,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0.6), // Dark blue
        });
        yPosition -= 25;
        
        // Company contact info
        if (companyData?.phoneNumber) {
          page.drawText(`Tel: ${companyData.phoneNumber}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= 12;
        }
        
        if (companyData?.email) {
          page.drawText(`Email: ${companyData.email}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= 12;
        }
        
        if (companyData?.address) {
          page.drawText(`Alamat: ${companyData.address}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= 15;
        }
        
        yPosition -= 20;
        
        // Report Title - centered and bold
        page.drawText('LAPORAN REKOD CUTI PEKERJA', {
          x: (width - 280) / 2,
          y: yPosition,
          size: 16,
          font: boldFont,
          color: rgb(0, 0, 0.6), // Dark blue
        });
        yPosition -= 30;
        
        // Generation date and time
        const currentDateTime = new Date().toLocaleString('ms-MY', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        page.drawText(`Dijana pada: ${currentDateTime}`, {
          x: 50,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 30;
        
        // === EMPLOYEE INFO SECTION ===
        // Employee info box background
        page.drawRectangle({
          x: 45,
          y: yPosition - 80,
          width: width - 90,
          height: 80,
          borderColor: rgb(0, 0, 0.6),
          borderWidth: 1,
          color: rgb(0.95, 0.97, 1), // Light blue background
        });
        
        // Employee details
        page.drawText(`Nama: ${employee.employeeName}`, {
          x: 55,
          y: yPosition - 20,
          size: 12,
          font: boldFont,
        });
        
        page.drawText(`IC Number: ${employee.icNumber || employee.employeeId}`, {
          x: 55,
          y: yPosition - 35,
          size: 10,
          font: font,
        });
        
        // Add department and year if available  
        page.drawText(`Tahun: ${data.filters.year || new Date().getFullYear()}`, {
          x: 55,
          y: yPosition - 50,
          size: 10,
          font: font,
        });
        
        if (data.filters.department && data.filters.department !== 'all') {
          page.drawText(`Jabatan: ${data.filters.department}`, {
            x: 55,
            y: yPosition - 65,
            size: 10,
            font: font,
          });
        }
        
        yPosition -= 100;
        
        // === TABLE SECTION ===
        const tableHeaders = ['No.', 'Jenis Cuti', 'Kelayakan', 'Digunakan', 'Baki Semasa', 'Status'];
        const columnWidths = [40, 140, 80, 80, 80, 100];
        const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        const tableStartX = (width - tableWidth) / 2;
        
        // Table header with dark blue background
        page.drawRectangle({
          x: tableStartX,
          y: yPosition - 25,
          width: tableWidth,
          height: 25,
          borderColor: rgb(0, 0, 0.6),
          borderWidth: 1,
          color: rgb(0, 0, 0.6), // Dark blue header
        });
        
        // Header text in white
        let currentX = tableStartX;
        tableHeaders.forEach((header, index) => {
          page.drawText(header, {
            x: currentX + 5,
            y: yPosition - 18,
            size: 10,
            font: boldFont,
            color: rgb(1, 1, 1), // White text
          });
          currentX += columnWidths[index];
        });
        
        yPosition -= 25;
        
        // Table rows with leave data
        const leaveTypes = Object.entries(employee.leaveBreakdown);
        console.log(`Processing employee ${employee.employeeName}:`, {
          leaveTypesCount: leaveTypes.length,
          leaveTypes: leaveTypes.map(([type, data]) => ({
            type,
            entitlement: data.entitlementDays,
            taken: data.takenDays,
            balance: data.balanceDays,
            excluded: data.roleBasedExcluded
          }))
        });
        
        let rowNumber = 1;
        
        leaveTypes.forEach(([leaveType, breakdown]) => {
          const isEvenRow = rowNumber % 2 === 0;
          
          // Row background (striping)
          page.drawRectangle({
            x: tableStartX,
            y: yPosition - 20,
            width: tableWidth,
            height: 20,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
            color: isEvenRow ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1), // Light grey/white striping
          });
          
          currentX = tableStartX;
          
          // Row Number
          page.drawText(rowNumber.toString(), {
            x: currentX + 15, // Center align in narrow column
            y: yPosition - 14,
            size: 9,
            font: font,
          });
          currentX += columnWidths[0];
          
          // Leave Type
          const leaveTypeName = leaveType.length > 18 ? leaveType.substring(0, 18) + "..." : leaveType;
          page.drawText(leaveTypeName, {
            x: currentX + 5,
            y: yPosition - 14,
            size: 9,
            font: font,
          });
          currentX += columnWidths[1];
          
          // Entitlement (right align)
          page.drawText(breakdown.entitlementDays?.toString() || '0', {
            x: currentX + columnWidths[2] - 25,
            y: yPosition - 14,
            size: 9,
            font: font,
          });
          currentX += columnWidths[2];
          
          // Taken (right align)
          page.drawText(breakdown.takenDays?.toString() || '0', {
            x: currentX + columnWidths[3] - 25,
            y: yPosition - 14,
            size: 9,
            font: font,
          });
          currentX += columnWidths[3];
          
          // Balance (right align)
          page.drawText(breakdown.balanceDays?.toString() || '0', {
            x: currentX + columnWidths[4] - 25,
            y: yPosition - 14,
            size: 9,
            font: font,
          });
          currentX += columnWidths[4];
          
          // Status with color coding
          const status = breakdown.roleBasedExcluded ? 'Dikecualikan' : 
                        (breakdown.balanceDays > 0 ? 'Tersedia' : 'Habis');
          const statusColor = breakdown.roleBasedExcluded ? rgb(0.5, 0.5, 0.5) : // Grey
                             (breakdown.balanceDays > 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)); // Green or Red
          
          page.drawText(status, {
            x: currentX + 5,
            y: yPosition - 14,
            size: 9,
            font: boldFont,
            color: statusColor,
          });
          
          yPosition -= 20;
          rowNumber++;
        });
        
        yPosition -= 20;
        
        // === SUMMARY SECTION ===
        // Calculate totals
        const totalEntitlement = Object.values(employee.leaveBreakdown)
          .filter(breakdown => !breakdown.roleBasedExcluded)
          .reduce((sum, breakdown) => sum + (breakdown.entitlementDays || 0), 0);
        const totalTaken = Object.values(employee.leaveBreakdown)
          .filter(breakdown => !breakdown.roleBasedExcluded)
          .reduce((sum, breakdown) => sum + (breakdown.takenDays || 0), 0);
        const totalBalance = Object.values(employee.leaveBreakdown)
          .filter(breakdown => !breakdown.roleBasedExcluded)
          .reduce((sum, breakdown) => sum + (breakdown.balanceDays || 0), 0);
        
        // Summary box
        page.drawRectangle({
          x: tableStartX,
          y: yPosition - 60,
          width: tableWidth,
          height: 60,
          borderColor: rgb(0, 0, 0.6),
          borderWidth: 1,
          color: rgb(0.98, 0.98, 0.98),
        });
        
        page.drawText('RINGKASAN', {
          x: tableStartX + 10,
          y: yPosition - 18,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0.6),
        });
        
        page.drawText(`Jumlah Kelayakan: ${totalEntitlement}`, {
          x: tableStartX + 10,
          y: yPosition - 33,
          size: 10,
          font: font,
        });
        
        page.drawText(`Jumlah Digunakan: ${totalTaken}`, {
          x: tableStartX + 10,
          y: yPosition - 47,
          size: 10,
          font: font,
        });
        
        page.drawText(`Jumlah Baki: ${totalBalance}`, {
          x: tableStartX + 200,
          y: yPosition - 33,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.6, 0),
        });
        
        // === FOOTER SECTION ===
        const footerY = 40;
        
        // Footer text
        page.drawText(`Dijana oleh UtamaHR Sistem pada ${currentDateTime}`, {
          x: 50,
          y: footerY,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        // Page number
        page.drawText(`Halaman ${empIndex + 1} dari ${data.employees.length}`, {
          x: width - 150,
          y: footerY,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

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