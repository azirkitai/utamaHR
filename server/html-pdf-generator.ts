import html_to_pdf from 'html-pdf-node';

export async function generatePDFFromHTML(htmlContent: string, options: any = {}): Promise<Buffer> {
  try {
    console.log('=== HTML-PDF-NODE GENERATION ===');
    
    const defaultOptions = {
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      displayHeaderFooter: false,
      printBackground: true,
      preferCSSPageSize: true,
      ...options
    };

    const htmlOptions = { 
      content: htmlContent 
    };

    console.log('Generating PDF with html-pdf-node...');
    const pdfBuffer = await html_to_pdf.generatePdf(htmlOptions, defaultOptions);
    console.log('PDF generated successfully with html-pdf-node');
    
    return pdfBuffer;
  } catch (error) {
    console.error('HTML-PDF-NODE generation error:', error);
    throw new Error('Failed to generate PDF with html-pdf-node: ' + error.message);
  }
}

export function generateSimplePayslipHTML(data: {
  employee: {
    fullName: string;
    employeeNo: string;
    ic: string;
    id: string;
  };
  document: {
    month: string | number;
    year: number;
    id: string;
  };
  payroll: {
    grossPay: number;
    totalDeductions: number;
    netPay: number | string;
  };
  company?: {
    name?: string;
    address?: string;
  };
  generated: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - ${data.employee.fullName}</title>
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
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .title {
            font-size: 16px;
            font-weight: bold;
            color: #555;
            margin-bottom: 10px;
        }
        
        .period {
            font-size: 14px;
            color: #666;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            background-color: #f8f9fa;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 13px;
            border: 1px solid #dee2e6;
            border-bottom: none;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dee2e6;
        }
        
        .info-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .info-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #dee2e6;
            vertical-align: top;
        }
        
        .info-table .label {
            font-weight: bold;
            width: 40%;
            color: #555;
        }
        
        .info-table .value {
            width: 60%;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .net-pay {
            background-color: #e8f5e8;
            font-size: 14px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #dee2e6;
            padding-top: 15px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: none;
                margin: 0;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">${data.company?.name || 'UTAMA MEDGROUP'}</div>
            <div class="title">SLIP GAJI</div>
            <div class="period">${data.document.month}/${data.document.year}</div>
        </div>

        <!-- Employee Information -->
        <div class="section">
            <div class="section-title">MAKLUMAT PEKERJA</div>
            <table class="info-table">
                <tr>
                    <td class="label">Nama Pekerja:</td>
                    <td class="value">${data.employee.fullName}</td>
                </tr>
                <tr>
                    <td class="label">No. Pekerja:</td>
                    <td class="value">${data.employee.employeeNo}</td>
                </tr>
                <tr>
                    <td class="label">No. IC:</td>
                    <td class="value">${data.employee.ic}</td>
                </tr>
                <tr>
                    <td class="label">Bulan/Tahun:</td>
                    <td class="value">${data.document.month}/${data.document.year}</td>
                </tr>
            </table>
        </div>

        <!-- Salary Information -->
        <div class="section">
            <div class="section-title">BUTIRAN GAJI</div>
            <table class="info-table">
                <tr>
                    <td class="label">Jumlah Gaji Kasar:</td>
                    <td class="value amount">RM ${parseFloat(data.payroll.grossPay.toString()).toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="label">Jumlah Potongan:</td>
                    <td class="value amount">RM ${parseFloat(data.payroll.totalDeductions.toString()).toFixed(2)}</td>
                </tr>
                <tr class="net-pay">
                    <td class="label">GAJI BERSIH:</td>
                    <td class="value amount">RM ${parseFloat(data.payroll.netPay.toString()).toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>Dihasilkan pada: ${data.generated}</div>
            <div>Document ID: ${data.document.id}</div>
            <div style="margin-top: 10px;">--- Dokumen ini adalah janaan komputer ---</div>
        </div>
    </div>
</body>
</html>
  `;
}