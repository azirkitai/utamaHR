import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface VoucherData {
  company: {
    name: string;
    address: string;
    email: string;
  };
  voucher: {
    number: string;
    date: string;
    month: string;
  };
  employee: {
    name: string;
    staffId: string;
    nric: string;
    bankAccount: string;
  };
  claims: Array<{
    description: string;
    amount: string;
  }>;
  totalAmount: string;
  amountInWords: string;
}

function generateClaimRows(claims: VoucherData['claims']): string {
  return claims.map((claim, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${claim.description.toUpperCase()}</td>
      <td class="text-right">${claim.amount}</td>
    </tr>
  `).join('');
}

// NEW: Generate voucher HTML identical to preview tab content
function generateVoucherPreviewHTML(data: VoucherData): string {
  const claimsHTML = data.claims.map((claim, index) => `
    <div key="${index}" class="flex justify-between py-2 border-b border-gray-200">
      <span class="text-sm">${claim.description.toUpperCase()}</span>
      <span class="font-medium">${claim.amount}</span>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <title>Payment Voucher - ${data.voucher.number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 32px;
        }
        
        .text-center { text-align: center; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 10px; }
        .font-bold { font-weight: bold; }
        .font-medium { font-weight: 500; }
        .text-gray-900 { color: #111827; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .mb-2 { margin-bottom: 8px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mt-4 { margin-top: 16px; }
        .mt-8 { margin-top: 32px; }
        .mt-16 { margin-top: 64px; }
        .pb-1 { padding-bottom: 4px; }
        .py-2 { padding-top: 8px; padding-bottom: 8px; }
        .py-3 { padding-top: 12px; padding-bottom: 12px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .border-b { border-bottom: 1px solid; }
        .border-b-2 { border-bottom: 2px solid; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-400 { border-color: #9ca3af; }
        .border-t { border-top: 1px solid; }
        .w-48 { width: 192px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-end { align-items: flex-end; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-8 { gap: 32px; }
    </style>
</head>
<body>
    <!-- Company Header -->
    <div class="text-center mb-8">
        <div class="text-lg font-bold text-gray-900 mb-2">
            ${data.company.name?.toUpperCase() || 'COMPANY NAME'}
        </div>
        ${data.company.address ? `<div class="text-sm text-gray-700 mb-1">${data.company.address}</div>` : ''}
        ${data.company.email ? `<div class="text-sm text-gray-700 mb-6">Email: ${data.company.email}</div>` : ''}
        
        <div class="text-2xl font-bold text-gray-900 mb-4">PAYMENT VOUCHER</div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-2 gap-8 mb-8">
        <!-- Left Side - PAID TO -->
        <div>
            <div class="mb-4">
                <div class="font-bold text-gray-900 mb-3">PAID TO:</div>
                <div class="space-y-1 text-sm">
                    <div>Name: ${data.employee.name}</div>
                    <div>NRIC: ${data.employee.nric}</div>
                    <div>Bank / Cheque No.: ${data.employee.bankAccount}</div>
                </div>
            </div>
            
            <div class="mt-8">
                <div class="font-bold text-gray-900 mb-3 border-b border-gray-400 pb-1">PAYMENT FOR:</div>
                <div class="space-y-1 text-sm">
                    <div class="font-bold">AMOUNT (RM)</div>
                </div>
            </div>
        </div>

        <!-- Right Side - Voucher Details -->
        <div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span>Payment Voucher No:</span>
                    <span class="font-medium">${data.voucher.number}</span>
                </div>
                <div class="flex justify-between">
                    <span>Payment Date:</span>
                    <span class="font-medium">${data.voucher.date}</span>
                </div>
                <div class="flex justify-between">
                    <span>Month:</span>
                    <span class="font-medium">${data.voucher.month}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Details -->
    <div class="mb-8">
        ${claimsHTML}
        
        <!-- Total Line -->
        <div class="flex justify-between py-3 border-b-2 border-gray-400 font-bold">
            <span>MALAYSIA RINGGIT : TOTAL</span>
            <span>${data.totalAmount}</span>
        </div>
        
        <!-- Amount in Words -->
        <div class="mt-4 text-sm">
            <div class="font-bold">MALAYSIA RINGGIT : ${data.amountInWords}</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-between items-end mt-16">
        <div class="text-center">
            <div class="border-t border-gray-400 w-48 mb-2"></div>
            <div class="text-xs">Prepared By</div>
        </div>
        <div class="text-center">
            <div class="border-t border-gray-400 w-48 mb-2"></div>
            <div class="text-xs">Checked By</div>
        </div>
        <div class="text-center">
            <div class="border-t border-gray-400 w-48 mb-2"></div>
            <div class="text-xs">Approved By</div>
        </div>
    </div>
</body>
</html>
  `;
}

export async function generateVoucherPDF(data: VoucherData): Promise<Buffer> {
  try {
    // Generate HTML using preview content structure
    const html = generateVoucherPreviewHTML(data);

    console.log('Voucher HTML template processed, length:', html.length);

    // Generate PDF using Puppeteer with exact same configuration as payroll
    console.log('Launching browser for voucher HTML-to-PDF conversion...');
    const browser = await puppeteer.launch({
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

    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Set viewport for voucher (A4 size)
    await page.setViewport({
      width: 794,  // A4 width in pixels
      height: 1123, // A4 height in pixels  
      deviceScaleFactor: 1
    });
    
    console.log('Setting voucher HTML content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    console.log('Generating voucher PDF...');
    
    // Add a small delay to ensure content is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use A4 format for voucher with tight margins for compact layout
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '6mm',
        right: '10mm', 
        bottom: '6mm',
        left: '10mm'
      }
    });
    
    console.log('Voucher PDF generated successfully, buffer size:', pdfBuffer.length);
    
    await browser.close();
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating voucher PDF:', error);
    throw error;
  }
}