import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';

// Field coordinates map (origin bottom-left) - based on the reference template
const FIELDS = {
  NAME:        { x: 95,  y: 645 },
  IC:          { x: 95,  y: 625 },
  POSITION:    { x: 95,  y: 605 },
  MONTH:       { x: 415, y: 645 },
  YEAR:        { x: 415, y: 625 },
  IN_BASIC:    { x: 180, y: 520, align: 'right' },
  IN_FIXED:    { x: 180, y: 500, align: 'right' },
  IN_GROSS:    { x: 180, y: 440, align: 'right' },   // TOTAL GROSS INCOME
  DED_EPF:     { x: 460, y: 520, align: 'right' },
  DED_SOCSO:   { x: 460, y: 500, align: 'right' },
  DED_EIS:     { x: 460, y: 480, align: 'right' },
  DED_TOTAL:   { x: 460, y: 440, align: 'right' },   // TOTAL DEDUCTIONS
  NET_INCOME:  { x: 420, y: 395, align: 'center', size: 16 },   // baris besar "NET INCOME"
  EMP_EPFER:   { x: 140, y: 340, align: 'center' },
  EMP_SOCSOER: { x: 305, y: 340, align: 'center' },
  EMP_EISER:   { x: 470, y: 340, align: 'center' },
  YTD_EMP:     { x: 210, y: 300, align: 'center' },
  YTD_ER:      { x: 510, y: 300, align: 'center' },
  MTD:         { x: 120, y: 280, align: 'center' }
};

interface PayslipData {
  company: {
    name: string;
    regNo: string;
    addressLines: string[];
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
    totalGross: string;
  };
  deduction: {
    epfEmp: string;
    socsoEmp: string;
    eisEmp: string;
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

function formatMoney(amount: string): string {
  return `RM ${amount}`;
}

// Helper function to draw text with alignment
function drawText(page: any, text: string, field: any, fontSize: number = 12, useFont: any) {
  const textWidth = useFont.widthOfTextAtSize(text, fontSize);
  let x = field.x;
  
  if (field.align === 'right') {
    x = field.x - textWidth;
  } else if (field.align === 'center') {
    x = field.x - (textWidth / 2);
  }
  
  page.drawText(text, {
    x: x,
    y: field.y,
    size: fontSize,
    font: useFont,
    color: rgb(0, 0, 0),
  });
}

export async function generatePayslipFromTemplate(data: PayslipData): Promise<Buffer> {
  try {
    // Load the template PDF
    const templatePath = join(__dirname, 'payslip-template.pdf');
    const templateBytes = readFileSync(templatePath);
    
    // Create PDF document from template
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Get page dimensions
    const { width, height } = firstPage.getSize();
    console.log(`Page dimensions: ${width} x ${height}`);
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    

    
    // Draw employee information
    drawText(firstPage, data.employee.name, FIELDS.NAME, 12, fontBold);
    drawText(firstPage, data.employee.icNo || '', FIELDS.IC, 12, font);
    drawText(firstPage, data.employee.position, FIELDS.POSITION, 12, font);
    drawText(firstPage, data.period.month, FIELDS.MONTH, 12, fontBold);
    drawText(firstPage, data.period.year.toString(), FIELDS.YEAR, 12, fontBold);
    
    // Draw income section
    drawText(firstPage, formatMoney(data.income.basic), FIELDS.IN_BASIC, 12, font);
    drawText(firstPage, formatMoney(data.income.fixedAllowance), FIELDS.IN_FIXED, 12, font);
    drawText(firstPage, formatMoney(data.income.totalGross), FIELDS.IN_GROSS, 12, fontBold);
    
    // Draw deduction section
    drawText(firstPage, formatMoney(data.deduction.epfEmp), FIELDS.DED_EPF, 12, font);
    drawText(firstPage, formatMoney(data.deduction.socsoEmp), FIELDS.DED_SOCSO, 12, font);
    drawText(firstPage, formatMoney(data.deduction.eisEmp), FIELDS.DED_EIS, 12, font);
    drawText(firstPage, formatMoney(data.deduction.total), FIELDS.DED_TOTAL, 12, fontBold);
    
    // Draw net income (prominent)
    drawText(firstPage, formatMoney(data.netIncome), FIELDS.NET_INCOME, 16, fontBold);
    
    // Draw employer contributions
    drawText(firstPage, formatMoney(data.employerContrib.epfEr), FIELDS.EMP_EPFER, 11, font);
    drawText(firstPage, formatMoney(data.employerContrib.socsoEr), FIELDS.EMP_SOCSOER, 11, font);
    drawText(firstPage, formatMoney(data.employerContrib.eisEr), FIELDS.EMP_EISER, 11, font);
    
    // Draw YTD information
    drawText(firstPage, formatMoney(data.ytd.employee), FIELDS.YTD_EMP, 11, fontBold);
    drawText(firstPage, formatMoney(data.ytd.employer), FIELDS.YTD_ER, 11, fontBold);
    drawText(firstPage, formatMoney(data.ytd.mtd), FIELDS.MTD, 11, fontBold);
    
    // Generate PDF buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('Error generating payslip from template:', error);
    throw error;
  }
}