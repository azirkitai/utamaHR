import puppeteer from 'puppeteer';
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
  let browser = null;
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

    console.log('PDF generation input data:', {
      employeeCount: data.employees.length,
      filters: data.filters,
      reportTitle: data.reportTitle,
      sampleEmployee: data.employees[0] ? {
        name: data.employees[0].employeeName,
        leaveTypesCount: Object.keys(data.employees[0].leaveBreakdown || {}).length
      } : null
    });

    // Generate HTML content
    const htmlContent = generateLeaveReportHTML(data, company);
    console.log('HTML content generated, length:', htmlContent.length);
    
    // Launch browser with EXACT same config as working payslip system
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport exactly like payslip
    await page.setViewport({
      width: 800, // Standard width for A4
      height: 1200, // Standard height for A4
      deviceScaleFactor: 1
    });
    
    console.log('Setting HTML content...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    console.log('Generating PDF...');
    
    // Add a delay to ensure content is rendered like payslip
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use exact same PDF settings as payslip
    const pdfBuffer = await page.pdf({
      format: 'A4' as const,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '10mm',
        right: '10mm', 
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    console.log('PDF buffer generated, size:', pdfBuffer.length);
    
    // Write to file for debugging
    const fs = await import('fs');
    await fs.promises.writeFile('debug_leave_report.pdf', pdfBuffer);
    console.log('Debug PDF saved to debug_leave_report.pdf');
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// jsPDF functions removed - now using HTML + Puppeteer approach like payslip

function generateLeaveReportHTML(data: LeaveReportData, company: any): string {
  const currentDate = new Date().toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  const filterText = [];
  if (data.filters.department && data.filters.department !== 'all') {
    filterText.push(`Jabatan: ${data.filters.department}`);
  }
  if (data.filters.year) {
    filterText.push(`Tahun: ${data.filters.year}`);
  }

  return `
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Cuti - ${data.reportTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0f172a;
    }
    
    .company-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0891b2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 24px;
    }
    
    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 5px;
    }
    
    .report-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e40af;
      margin: 10px 0;
    }
    
    .report-info {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .filters-info {
      font-size: 11px;
      color: #0891b2;
      font-weight: 500;
    }
    
    .employee-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .employee-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0891b2 100%);
      color: white;
      padding: 12px 15px;
      margin-bottom: 0;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .employee-name {
      font-size: 14px;
      font-weight: bold;
    }
    
    .leave-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
    }
    
    .leave-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 6px 6px;
      overflow: hidden;
    }
    
    .leave-table th {
      background: #f8fafc;
      color: #374151;
      font-weight: bold;
      padding: 10px 8px;
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      font-size: 11px;
    }
    
    .leave-table td {
      padding: 8px;
      border-bottom: 1px solid #f1f5f9;
      text-align: center;
      font-size: 11px;
    }
    
    .leave-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .leave-type-cell {
      text-align: left !important;
      font-weight: 500;
    }
    
    .number-cell {
      text-align: right !important;
      font-weight: 500;
    }
    
    .status-available {
      background: #dcfce7;
      color: #166534;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .status-exhausted {
      background: #fef2f2;
      color: #991b1b;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .status-excluded {
      background: #f3f4f6;
      color: #6b7280;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .status-excess {
      background: #fef3c7;
      color: #92400e;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .excluded-row {
      opacity: 0.6;
      background: #f9fafb !important;
    }
    
    .excluded-row .leave-type-cell,
    .excluded-row .number-cell {
      color: #9ca3af !important;
    }
    
    .summary-footer {
      background: #f8fafc;
      padding: 12px 15px;
      border: 1px solid #e2e8f0;
      border-top: 2px solid #0891b2;
      border-radius: 0 0 6px 6px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-value {
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 3px;
    }
    
    .summary-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 500;
    }
    
    .summary-baki .summary-value {
      color: #0891b2;
    }
    
    @media print {
      body {
        font-size: 11px;
      }
      
      .employee-section {
        page-break-inside: avoid;
        margin-bottom: 30px;
      }
      
      .header {
        margin-bottom: 25px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-logo">UH</div>
    <div class="company-name">${company.companyName}</div>
    <div class="report-title">${data.reportTitle}</div>
    <div class="report-info">Dijana pada: ${currentDate}</div>
    ${filterText.length > 0 ? `<div class="filters-info">Tapisan: ${filterText.join(' | ')}</div>` : ''}
  </div>

  ${data.employees && data.employees.length > 0 ? data.employees.map(employee => {
    const leaveTypes = Object.entries(employee.leaveBreakdown);
    const leaveTypeCount = leaveTypes.length;
    
    const totalEntitlement = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.entitlementDays || 0), 0);
    const totalUsed = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.daysTaken || 0), 0);
    const totalRemaining = leaveTypes.reduce((sum, [_, breakdown]) => sum + (breakdown.remainingDays || 0), 0);

    return `
    <div class="employee-section">
      <div class="employee-header">
        <div class="employee-name">${employee.employeeName}</div>
        <div class="leave-count">${leaveTypeCount} Jenis Cuti</div>
      </div>
      
      <table class="leave-table">
        <thead>
          <tr>
            <th style="width: 50px;">No.</th>
            <th style="width: 200px;">Jenis Cuti</th>
            <th style="width: 80px;">Kelayakan</th>
            <th style="width: 80px;">Digunakan</th>
            <th style="width: 80px;">Baki Semasa</th>
            <th style="width: 100px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${leaveTypes.map(([leaveType, breakdown], index) => {
            let statusClass = 'status-available';
            let statusText = 'Tersedia';
            
            if (!breakdown.isEligible) {
              statusClass = 'status-excluded';
              statusText = 'Dikecualikan';
            } else if (breakdown.remainingDays === 0) {
              statusClass = 'status-exhausted';
              statusText = 'Habis';
            } else if (breakdown.remainingDays < 0) {
              statusClass = 'status-excess';
              statusText = 'Terlebih';
            }
            
            return `
            <tr class="${!breakdown.isEligible ? 'excluded-row' : ''}">
              <td>${index + 1}</td>
              <td class="leave-type-cell">${leaveType}</td>
              <td class="number-cell">${breakdown.entitlementDays}</td>
              <td class="number-cell">${breakdown.daysTaken}</td>
              <td class="number-cell">${breakdown.remainingDays}</td>
              <td><span class="${statusClass}">${statusText}</span></td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="summary-footer">
        <div class="summary-item">
          <div class="summary-value">${totalEntitlement}</div>
          <div class="summary-label">Jumlah Kelayakan</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${totalUsed}</div>
          <div class="summary-label">Jumlah Digunakan</div>
        </div>
        <div class="summary-item summary-baki">
          <div class="summary-value">${totalRemaining}</div>
          <div class="summary-label">Jumlah Baki</div>
        </div>
      </div>
    </div>
    `;
  }).join('') : '<div style="text-align: center; padding: 40px; color: #666;"><h3>Tiada Data Pekerja Ditemui</h3><p>Sila pastikan tapisan yang dipilih betul dan terdapat data pekerja dalam sistem.</p></div>'}
</body>
</html>
  `;
}