import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';

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
      <td>financial</td>
      <td class="text-right">${claim.amount}</td>
    </tr>
  `).join('');
}

export async function generateVoucherPDF(data: VoucherData): Promise<Buffer> {
  try {
    // Load the HTML template
    const templatePath = join(__dirname, 'voucher-template.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Generate dynamic claim rows
    const claimRows = generateClaimRows(data.claims);
    
    // Replace all placeholders
    html = html
      // Company info
      .replace('{{company.name}}', data.company.name)
      .replace('{{company.address}}', data.company.address)
      .replace('{{company.email}}', data.company.email)
      
      // Voucher info
      .replace(/{{voucher\.number}}/g, data.voucher.number)
      .replace(/{{voucher\.date}}/g, data.voucher.date)
      .replace('{{voucher.month}}', data.voucher.month)
      
      // Employee info
      .replace(/{{employee\.name}}/g, data.employee.name)
      .replace('{{employee.staffId}}', data.employee.staffId)
      .replace('{{employee.nric}}', data.employee.nric)
      .replace('{{employee.bankAccount}}', data.employee.bankAccount)
      
      // Claims and totals
      .replace('{{claimRows}}', claimRows)
      .replace('{{totalAmount}}', data.totalAmount)
      .replace('{{amountInWords}}', data.amountInWords);

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
    
    // Use A4 format for voucher (larger than payslip)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '10mm',
        right: '10mm', 
        bottom: '10mm',
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