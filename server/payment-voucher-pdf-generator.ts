import puppeteer from 'puppeteer';
import type { PaymentVoucher, ClaimApplication } from '@shared/schema';

export interface VoucherPDFData {
  voucher: PaymentVoucher;
  claims: ClaimApplication[];
  companySettings: any;
  employees: any[];
}

export async function generatePaymentVoucherPDF(data: VoucherPDFData): Promise<Buffer> {
  const { voucher, claims, companySettings, employees } = data;

  // Helper functions
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.fullName : 'Unknown Employee';
  };

  const getEmployeeNRIC = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.nric || 'Not Stated';
  };

  const getEmployeeBankInfo = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee?.bankName && employee?.accountNumber) {
      return `${employee.bankName} - ${employee.accountNumber}`;
    }
    return 'Not Stated';
  };

  const convertToWords = (amount: number): string => {
    if (amount === 0) return 'ZERO';
    
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const convert = (num: number): string => {
      if (num === 0) return '';
      else if (num < 20) return ones[num];
      else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      else if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      else if (num < 1000000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      else return convert(Math.floor(num / 1000000)) + ' MILLION' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
    };
    
    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);
    
    let result = convert(wholePart);
    if (decimalPart > 0) {
      result += ' AND ' + convert(decimalPart) + ' CENTS';
    }
    
    return result + ' ONLY';
  };

  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" },
    { value: "3", label: "March" }, { value: "4", label: "April" },
    { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" },
    { value: "9", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  const monthName = months.find(m => m.value === voucher.month.toString())?.label || `Month ${voucher.month}`;
  const totalAmount = claims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1f2937;
            line-height: 1.4;
        }
        .voucher-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        .company-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .company-details {
            font-size: 12px;
            margin-bottom: 4px;
            color: #374151;
        }
        .voucher-title {
            font-size: 24px;
            font-weight: bold;
            margin-top: 24px;
        }
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .paid-to-section {
            font-size: 12px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 12px;
        }
        .employee-details {
            margin-bottom: 4px;
        }
        .payment-for-section {
            margin-top: 32px;
        }
        .payment-for-title {
            font-weight: bold;
            margin-bottom: 12px;
            border-bottom: 1px solid #9ca3af;
            padding-bottom: 4px;
        }
        .voucher-details {
            font-size: 12px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .detail-value {
            font-weight: 500;
        }
        .payment-details {
            margin-bottom: 40px;
        }
        .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }
        .payment-total {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 2px solid #9ca3af;
            font-weight: bold;
        }
        .amount-words {
            margin-top: 16px;
            font-size: 12px;
            font-weight: bold;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
        }
        .signature-section {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #9ca3af;
            margin-bottom: 8px;
        }
        .signature-label {
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="voucher-container">
        <!-- Company Header -->
        <div class="company-header">
            <div class="company-name">
                ${companySettings?.companyName?.toUpperCase() || 'COMPANY NAME'}
            </div>
            ${companySettings?.address ? `<div class="company-details">${companySettings.address}</div>` : ''}
            ${companySettings?.city && companySettings?.state && companySettings?.postalCode ? 
              `<div class="company-details">${companySettings.postalCode} ${companySettings.city}, ${companySettings.state}</div>` : ''}
            ${(companySettings?.phone || companySettings?.fax) ? 
              `<div class="company-details">
                ${companySettings.phone ? `Tel: ${companySettings.phone}` : ''}
                ${companySettings.phone && companySettings.fax ? ' | ' : ''}
                ${companySettings.fax ? `Fax: ${companySettings.fax}` : ''}
              </div>` : ''}
            ${companySettings?.email ? `<div class="company-details">Email: ${companySettings.email}</div>` : ''}
            
            <div class="voucher-title">PAYMENT VOUCHER</div>
        </div>

        <!-- Main Content Grid -->
        <div class="main-content">
            <!-- Left Side - PAID TO -->
            <div class="paid-to-section">
                <div class="section-title">PAID TO:</div>
                ${claims.length > 0 ? `
                <div class="employee-details">Employee No: ${claims[0].employeeId}</div>
                <div class="employee-details">Name: ${getEmployeeName(claims[0].employeeId)}</div>
                <div class="employee-details">NRIC: ${getEmployeeNRIC(claims[0].employeeId)}</div>
                <div class="employee-details">Bank / Cheque No.: ${getEmployeeBankInfo(claims[0].employeeId)}</div>
                ` : ''}
                
                <div class="payment-for-section">
                    <div class="payment-for-title">PAYMENT FOR:</div>
                    <div style="font-weight: bold;">AMOUNT (RM)</div>
                </div>
            </div>

            <!-- Right Side - Voucher Details -->
            <div class="voucher-details">
                <div class="detail-row">
                    <span>Payment Voucher No:</span>
                    <span class="detail-value">${voucher.voucherNumber}</span>
                </div>
                <div class="detail-row">
                    <span>Payment Date:</span>
                    <span class="detail-value">${new Date(voucher.paymentDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div class="detail-row">
                    <span>Month:</span>
                    <span class="detail-value">${monthName}</span>
                </div>
            </div>
        </div>

        <!-- Payment Details -->
        <div class="payment-details">
            ${claims.map(claim => `
            <div class="payment-item">
                <span>${claim.claimCategory.toUpperCase()}</span>
                <span>${(parseFloat(claim.amount || '0') || 0).toFixed(2)}</span>
            </div>
            `).join('')}
            
            <!-- Total Line -->
            <div class="payment-total">
                <span>MALAYSIA RINGGIT : TOTAL</span>
                <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            <!-- Amount in Words -->
            <div class="amount-words">
                MALAYSIA RINGGIT : ${convertToWords(totalAmount)}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-label">Prepared By</div>
            </div>
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-label">Checked By</div>
            </div>
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-label">Approved By</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}