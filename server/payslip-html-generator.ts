import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PayslipData {
  company: {
    name: string;
    regNo: string;
    address: string;
    logoHTML: string;
  };
  employee: {
    name: string;
    icNo: string;
    position: string;
  };
  period: {
    month: string;
    year: number;
  };
  income: {
    basic: string;
    fixedAllowance: string;
    items: Array<{
      label: string;
      amount: string;
      show: boolean;
    }>;
    totalGross: string;
  };
  deduction: {
    epfEmp: string;
    socsoEmp: string;
    eisEmp: string;
    items: Array<{
      label: string;
      amount: string;
      show: boolean;
    }>;
    total: string;
  };
  netIncome: string;
  employerContrib: {
    epfEr: string;
    socsoEr: string;
    eisEr: string;
  };
  ytd: {
    employee: string;
    employer: string;
    mtd: string;
  };
}

function generateItemRows(items: Array<{ label: string; amount: string; show: boolean }>): string {
  return items
    .filter(item => item.show)
    .map(item => `<div class="rowi"><div>${item.label}</div><div class="money">RM ${item.amount}</div></div>`)
    .join('\n      ');
}

// Function to generate HTML content only (for preview)
export function generatePayslipHTML(data: PayslipData): string {
  try {
    // Load the HTML template
    const templatePath = join(__dirname, 'payslip-template.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Generate dynamic income and deduction items
    const incomeItems = generateItemRows(data.income.items);
    const deductionItems = generateItemRows(data.deduction.items);
    
    // Replace all placeholders
    html = html
      // Company info
      .replace('{{company.name}}', data.company.name)
      .replace('{{company.regNo}}', data.company.regNo)
      .replace('{{company.address}}', data.company.address)
      .replace('{{company.logoHTML}}', data.company.logoHTML)
      
      // Employee info
      .replace('{{employee.name}}', data.employee.name)
      .replace('{{employee.icNo}}', data.employee.icNo || '')
      .replace('{{employee.position}}', data.employee.position)
      
      // Period
      .replace('{{period.month}}', data.period.month)
      .replace('{{period.year}}', data.period.year.toString())
      
      // Income
      .replace('{{income.basic}}', data.income.basic)
      .replace('{{income.fixedAllowance}}', data.income.fixedAllowance)
      .replace('{{income.totalGross}}', data.income.totalGross)
      .replace('{{incomeItems}}', incomeItems)
      
      // Deductions
      .replace('{{deduction.epfEmp}}', data.deduction.epfEmp)
      .replace('{{deduction.socsoEmp}}', data.deduction.socsoEmp)
      .replace('{{deduction.eisEmp}}', data.deduction.eisEmp)
      .replace('{{deduction.total}}', data.deduction.total)
      .replace('{{deductionItems}}', deductionItems)
      
      // Net income
      .replace('{{netIncome}}', data.netIncome)
      
      // Employer contributions
      .replace('{{employerContrib.epfEr}}', data.employerContrib.epfEr)
      .replace('{{employerContrib.socsoEr}}', data.employerContrib.socsoEr)
      .replace('{{employerContrib.eisEr}}', data.employerContrib.eisEr)
      
      // YTD
      .replace('{{ytd.employee}}', data.ytd.employee)
      .replace('{{ytd.employer}}', data.ytd.employer)
      .replace('{{ytd.mtd}}', data.ytd.mtd)
      // YTD Breakdown items
      .replace('{{ytd.breakdown.epfEmployee}}', data.ytd.breakdown?.epfEmployee || '0.00')
      .replace('{{ytd.breakdown.socsoEmployee}}', data.ytd.breakdown?.socsoEmployee || '0.00')
      .replace('{{ytd.breakdown.eisEmployee}}', data.ytd.breakdown?.eisEmployee || '0.00')
      .replace('{{ytd.breakdown.pcb}}', data.ytd.breakdown?.pcb || '0.00')
      .replace('{{ytd.breakdown.epfEmployer}}', data.ytd.breakdown?.epfEmployer || '0.00')
      .replace('{{ytd.breakdown.socsoEmployer}}', data.ytd.breakdown?.socsoEmployer || '0.00')
      .replace('{{ytd.breakdown.eisEmployer}}', data.ytd.breakdown?.eisEmployer || '0.00');

    console.log('HTML template processed for preview, employee:', data.employee.name);
    return html;
    
  } catch (error) {
    console.error('Error generating payslip HTML:', error);
    throw error;
  }
}

export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  try {
    // Load the HTML template
    const templatePath = join(__dirname, 'payslip-template.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Generate dynamic income and deduction items
    const incomeItems = generateItemRows(data.income.items);
    const deductionItems = generateItemRows(data.deduction.items);
    
    // Replace all placeholders
    html = html
      // Company info
      .replace('{{company.name}}', data.company.name)
      .replace('{{company.regNo}}', data.company.regNo)
      .replace('{{company.address}}', data.company.address)
      .replace('{{company.logoHTML}}', data.company.logoHTML)
      
      // Employee info
      .replace('{{employee.name}}', data.employee.name)
      .replace('{{employee.icNo}}', data.employee.icNo || '')
      .replace('{{employee.position}}', data.employee.position)
      
      // Period
      .replace('{{period.month}}', data.period.month)
      .replace('{{period.year}}', data.period.year.toString())
      
      // Income
      .replace('{{income.basic}}', data.income.basic)
      .replace('{{income.fixedAllowance}}', data.income.fixedAllowance)
      .replace('{{income.totalGross}}', data.income.totalGross)
      .replace('{{incomeItems}}', incomeItems)
      
      // Deductions
      .replace('{{deduction.epfEmp}}', data.deduction.epfEmp)
      .replace('{{deduction.socsoEmp}}', data.deduction.socsoEmp)
      .replace('{{deduction.eisEmp}}', data.deduction.eisEmp)
      .replace('{{deduction.total}}', data.deduction.total)
      .replace('{{deductionItems}}', deductionItems)
      
      // Net income
      .replace('{{netIncome}}', data.netIncome)
      
      // Employer contributions
      .replace('{{employerContrib.epfEr}}', data.employerContrib.epfEr)
      .replace('{{employerContrib.socsoEr}}', data.employerContrib.socsoEr)
      .replace('{{employerContrib.eisEr}}', data.employerContrib.eisEr)
      
      // YTD
      .replace('{{ytd.employee}}', data.ytd.employee)
      .replace('{{ytd.employer}}', data.ytd.employer)
      .replace('{{ytd.mtd}}', data.ytd.mtd)
      // YTD Breakdown items
      .replace('{{ytd.breakdown.epfEmployee}}', data.ytd.breakdown?.epfEmployee || '0.00')
      .replace('{{ytd.breakdown.socsoEmployee}}', data.ytd.breakdown?.socsoEmployee || '0.00')
      .replace('{{ytd.breakdown.eisEmployee}}', data.ytd.breakdown?.eisEmployee || '0.00')
      .replace('{{ytd.breakdown.pcb}}', data.ytd.breakdown?.pcb || '0.00')
      .replace('{{ytd.breakdown.epfEmployer}}', data.ytd.breakdown?.epfEmployer || '0.00')
      .replace('{{ytd.breakdown.socsoEmployer}}', data.ytd.breakdown?.socsoEmployer || '0.00')
      .replace('{{ytd.breakdown.eisEmployer}}', data.ytd.breakdown?.eisEmployer || '0.00');

    console.log('HTML template processed, length:', html.length);

    // Generate PDF using Puppeteer with Replit-compatible configuration
    console.log('Launching browser for HTML-to-PDF conversion...');
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
    
    // Set very small viewport to force smaller content
    await page.setViewport({
      width: 400, // Very small width
      height: 550, // Very small height  
      deviceScaleFactor: 1
    });
    
    console.log('Setting HTML content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    console.log('Generating PDF...');
    
    // Add a small delay to ensure content is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try with exact pixel dimensions instead of format
    const pdfBuffer = await page.pdf({
      width: '120mm', // Smaller than A5 
      height: '170mm', // Smaller than A5
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '3mm',
        right: '3mm', 
        bottom: '3mm',
        left: '3mm'
      }
    });
    
    console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
    
    await browser.close();
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating payslip PDF:', error);
    throw error;
  }
}