import puppeteer from 'puppeteer';

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
    
    // Create HTML template for employee report
    const html = this.createEmployeeReportHTML(employees);
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper page settings
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    console.log(`✅ PDF report generated successfully`);
    
    // Convert Uint8Array to Buffer
    return Buffer.from(pdfUint8Array);
  }

  private createEmployeeReportHTML(employees: EmployeeWithDetails[]): string {
    const currentDate = new Date().toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'employed').length;
    const inactiveEmployees = totalEmployees - activeEmployees;

    return `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laporan Employee UtamaHR</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px 0;
                border-bottom: 3px solid #2563eb;
            }

            .company-logo {
                width: 60px;
                height: 60px;
                margin: 0 auto 15px auto;
                background: linear-gradient(135deg, #1e293b, #1e40af, #0891b2);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }

            .report-title {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 5px;
            }

            .report-subtitle {
                font-size: 14px;
                color: #64748b;
                margin-bottom: 15px;
            }

            .report-date {
                font-size: 12px;
                color: #475569;
                font-style: italic;
            }

            .summary-section {
                display: flex;
                justify-content: space-around;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }

            .summary-card {
                text-align: center;
                flex: 1;
                margin: 0 10px;
            }

            .summary-number {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 5px;
            }

            .summary-label {
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            .employee-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }

            .employee-table thead {
                background: linear-gradient(135deg, #1e293b, #1e40af);
                color: white;
            }

            .employee-table th {
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-right: 1px solid rgba(255,255,255,0.2);
            }

            .employee-table th:last-child {
                border-right: none;
            }

            .employee-table td {
                padding: 10px 8px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 11px;
                vertical-align: top;
            }

            .employee-table tbody tr:hover {
                background-color: #f8fafc;
            }

            .employee-table tbody tr:nth-child(even) {
                background-color: #fcfcfd;
            }

            .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .status-active {
                background-color: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .status-inactive {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #fecaca;
            }

            .role-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 9px;
                font-weight: 500;
                background: linear-gradient(135deg, #1e293b, #1e40af);
                color: white;
            }

            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 10px;
                color: #64748b;
            }

            .page-break {
                page-break-before: always;
            }

            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-logo">HR</div>
            <div class="report-title">LAPORAN MAKLUMAT EMPLOYEE</div>
            <div class="report-subtitle">UtamaHR Management System</div>
            <div class="report-date">Tarikh: ${currentDate}</div>
        </div>

        <div class="summary-section">
            <div class="summary-card">
                <div class="summary-number">${totalEmployees}</div>
                <div class="summary-label">Jumlah Employee</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${activeEmployees}</div>
                <div class="summary-label">Employee Aktif</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${inactiveEmployees}</div>
                <div class="summary-label">Employee Tidak Aktif</div>
            </div>
        </div>

        <table class="employee-table">
            <thead>
                <tr>
                    <th style="width: 5%;">No.</th>
                    <th style="width: 20%;">Nama Penuh</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 12%;">Role</th>
                    <th style="width: 15%;">Jawatan</th>
                    <th style="width: 12%;">Jabatan</th>
                    <th style="width: 13%;">No. Telefon</th>
                    <th style="width: 13%;">Email</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map((employee, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td style="font-weight: 600;">${employee.fullName || '-'}</td>
                        <td>
                            <span class="status-badge ${employee.status === 'employed' ? 'status-active' : 'status-inactive'}">
                                ${employee.status === 'employed' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                        </td>
                        <td>
                            <span class="role-badge">${employee.role || 'Employee'}</span>
                        </td>
                        <td>${employee.employment?.designation || '-'}</td>
                        <td>${employee.employment?.department || '-'}</td>
                        <td>${employee.contact?.phoneNumber || employee.contact?.mobileNumber || '-'}</td>
                        <td style="font-size: 10px;">${employee.contact?.email || employee.contact?.personalEmail || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <p>Laporan ini dijana secara automatik oleh UtamaHR System pada ${currentDate}</p>
            <p>© ${new Date().getFullYear()} UtamaHR Management System. Semua hak terpelihara.</p>
        </div>
    </body>
    </html>
    `;
  }
}