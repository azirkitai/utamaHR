import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PaymentVoucher, ClaimApplication } from '@shared/schema';

export interface VoucherPDFData {
  voucher: PaymentVoucher;
  claims: ClaimApplication[];
  company: {
    name: string;
    regNo?: string | null;
    address: string;
    phone?: string | null;
    email?: string | null;
  };
}

function convertToWords(num: number): string {
  if (num === 0) return "ZERO RINGGIT ONLY";
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

  function convertHundreds(num: number): string {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' HUNDRED ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      num = 0;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result;
  }

  let integerPart = Math.floor(num);
  let cents = Math.round((num - integerPart) * 100);
  
  if (integerPart === 0 && cents === 0) return "ZERO RINGGIT ONLY";
  
  let result = '';
  let thousandCounter = 0;
  
  while (integerPart > 0) {
    let chunk = integerPart % 1000;
    if (chunk !== 0) {
      result = convertHundreds(chunk) + thousands[thousandCounter] + ' ' + result;
    }
    integerPart = Math.floor(integerPart / 1000);
    thousandCounter++;
  }
  
  result = result.trim() + ' RINGGIT';
  
  if (cents > 0) {
    result += ' AND ' + convertHundreds(cents).trim() + ' SEN';
  }
  
  return result.trim() + ' ONLY';
}

export async function generatePaymentVoucherPDF(data: VoucherPDFData): Promise<Buffer> {
  const { voucher, claims, company } = data;
  const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.amount || '0'), 0);

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  
  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let yPosition = height - 60; // Start from top

  // Header - Company Info
  page.drawText(company.name || 'Company Name', {
    x: 50,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  if (company.regNo) {
    page.drawText(`Registration No: ${company.regNo}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });
    yPosition -= 15;
  }

  page.drawText(company.address || 'Company Address', {
    x: 50,
    y: yPosition,
    size: 11,
    font: font,
  });
  yPosition -= 15;

  if (company.phone) {
    page.drawText(`Phone: ${company.phone}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });
    yPosition -= 15;
  }

  if (company.email) {
    page.drawText(`Email: ${company.email}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });
    yPosition -= 15;
  }

  yPosition -= 20;

  // Title
  page.drawText('PAYMENT VOUCHER', {
    x: (width - 180) / 2,
    y: yPosition,
    size: 20,
    font: boldFont,
  });
  yPosition -= 40;

  // Voucher Info
  page.drawText(`Voucher No: ${voucher.voucherNumber || 'N/A'}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: boldFont,
  });

  const formattedDate = voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  page.drawText(`Date: ${formattedDate}`, {
    x: width - 150,
    y: yPosition,
    size: 12,
    font: boldFont,
  });
  yPosition -= 30;

  // Pay To
  page.drawText('PAY TO:', {
    x: 50,
    y: yPosition,
    size: 12,
    font: boldFont,
  });
  yPosition -= 20;

  page.drawText(voucher.employeeName || 'Employee Name', {
    x: 50,
    y: yPosition,
    size: 12,
    font: boldFont,
  });
  
  // Draw line under employee name
  page.drawLine({
    start: { x: 50, y: yPosition - 5 },
    end: { x: width - 50, y: yPosition - 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // Table Header
  const tableHeaders = ['No.', 'Description', 'Claim Type', 'Amount (RM)'];
  const columnWidths = [40, 200, 120, 100];
  let currentX = 50;

  // Draw table header background
  page.drawRectangle({
    x: 50,
    y: yPosition - 20,
    width: width - 100,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Draw table header border
  page.drawRectangle({
    x: 50,
    y: yPosition - 20,
    width: width - 100,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Draw table headers
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

  // Table rows
  claims.forEach((claim, index) => {
    currentX = 50;
    
    // Draw row background (alternating)
    if (index % 2 === 1) {
      page.drawRectangle({
        x: 50,
        y: yPosition - 20,
        width: width - 100,
        height: 20,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Draw row border
    page.drawRectangle({
      x: 50,
      y: yPosition - 20,
      width: width - 100,
      height: 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Row data
    const rowData = [
      (index + 1).toString(),
      claim.description || claim.supportingDocument || claim.claimType || 'Claim Item',
      claim.claimType || 'General',
      parseFloat(claim.amount || '0').toFixed(2)
    ];

    rowData.forEach((data, colIndex) => {
      const textX = colIndex === 3 ? currentX + columnWidths[colIndex] - 10 : currentX + 5; // Right align amount
      page.drawText(data || '', {
        x: textX,
        y: yPosition - 15,
        size: 10,
        font: font,
      });
      currentX += columnWidths[colIndex];
    });

    yPosition -= 20;
  });

  yPosition -= 30;

  // Total section
  page.drawRectangle({
    x: 50,
    y: yPosition - 25,
    width: width - 100,
    height: 25,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });

  page.drawText('MALAYSIA RINGGIT : TOTAL', {
    x: 60,
    y: yPosition - 18,
    size: 14,
    font: boldFont,
  });

  page.drawText(totalAmount.toFixed(2), {
    x: width - 120,
    y: yPosition - 18,
    size: 14,
    font: boldFont,
  });

  yPosition -= 40;

  // Amount in words
  page.drawRectangle({
    x: 50,
    y: yPosition - 25,
    width: width - 100,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText(`MALAYSIA RINGGIT : ${convertToWords(totalAmount)}`, {
    x: 60,
    y: yPosition - 18,
    size: 12,
    font: boldFont,
  });

  yPosition -= 80;

  // Signature section
  const signatureLabels = ['Prepared By', 'Checked By', 'Approved By'];
  const signatureSpacing = (width - 100) / 3;

  signatureLabels.forEach((label, index) => {
    const x = 50 + (index * signatureSpacing);
    
    // Signature line
    page.drawLine({
      start: { x: x + 10, y: yPosition },
      end: { x: x + signatureSpacing - 20, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Label
    page.drawText(label, {
      x: x + ((signatureSpacing - label.length * 6) / 2),
      y: yPosition - 20,
      size: 11,
      font: boldFont,
    });
  });

  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}