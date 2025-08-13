import Excel from 'exceljs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PayslipData {
  company: {
    name: string;
    regNo: string;
    addressLines: string[];
    phone?: string;
    email?: string;
    website?: string;
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
    advanceSalary?: string | null;
    subsistenceAllowance?: string | null;
    extraResponsibilityAllowance?: string | null;
    bikVola?: string | null;
    overtime?: string | null;
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
  const num = parseFloat(amount);
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generatePayslipExcel(data: PayslipData): Promise<{ excelPath: string; pdfPath: string }> {
  try {
    // Create a new workbook since we don't have the template file
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Payslip');
    
    // Set up the HQ layout structure
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      margins: {
        left: 0.75,
        right: 0.75,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };

    // Header - Confidential
    worksheet.getCell('A1').value = 'STRICTLY PRIVATE & CONFIDENTIAL';
    worksheet.getCell('A1').font = { size: 10, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'right' };
    worksheet.mergeCells('A1:H1');

    // Company Information
    worksheet.getCell('A3').value = data.company.name;
    worksheet.getCell('A3').font = { size: 18, bold: true };
    worksheet.mergeCells('A3:H3');

    worksheet.getCell('A4').value = data.company.regNo;
    worksheet.getCell('A4').font = { size: 12 };
    worksheet.mergeCells('A4:H4');

    worksheet.getCell('A5').value = data.company.addressLines[0] || '';
    worksheet.getCell('A5').font = { size: 12 };
    worksheet.mergeCells('A5:H5');

    if (data.company.addressLines[1]) {
      worksheet.getCell('A6').value = data.company.addressLines[1];
      worksheet.getCell('A6').font = { size: 12 };
      worksheet.mergeCells('A6:H6');
    }

    // Employee Details Panel
    let currentRow = 8;
    
    // Create bordered panel
    for (let row = currentRow; row <= currentRow + 3; row++) {
      for (let col = 1; col <= 8; col++) {
        worksheet.getCell(row, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }

    worksheet.getCell(`A${currentRow}`).value = 'NAME:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.employee.name;
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);

    worksheet.getCell(`E${currentRow}`).value = 'MONTH:';
    worksheet.getCell(`E${currentRow}`).font = { bold: true };
    worksheet.getCell(`F${currentRow}`).value = data.period.month;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);

    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'I/C NO.:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.employee.icNo || '';
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);

    worksheet.getCell(`E${currentRow}`).value = 'YEAR:';
    worksheet.getCell(`E${currentRow}`).font = { bold: true };
    worksheet.getCell(`F${currentRow}`).value = data.period.year.toString();
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);

    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'POSITION:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.employee.position;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);

    currentRow += 3;

    // Income and Deductions Tables
    // Income Table (A to D columns)
    worksheet.getCell(`A${currentRow}`).value = 'INCOME';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);

    // Deductions Table (E to H columns)
    worksheet.getCell(`E${currentRow}`).value = 'DEDUCTIONS';
    worksheet.getCell(`E${currentRow}`).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C55A5A' } };
    worksheet.mergeCells(`E${currentRow}:H${currentRow}`);

    currentRow++;

    // Income items - start with required fields
    const incomeStartRow = currentRow;
    let deductionRow = currentRow;
    
    // Basic Salary (always shown)
    worksheet.getCell(`A${currentRow}`).value = 'BASIC SALARY';
    worksheet.getCell(`C${currentRow}`).value = formatMoney(data.income.basic);
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    
    // Fixed Allowance (always shown)
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'FIXED ALLOWANCE';
    worksheet.getCell(`C${currentRow}`).value = formatMoney(data.income.fixedAllowance);
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    
    // Dynamic income fields - only show if they have values
    const incomeFields = [
      { label: 'ADVANCE SALARY', value: data.income.advanceSalary },
      { label: 'SUBSISTENCE ALLOWANCE', value: data.income.subsistenceAllowance },
      { label: 'EXTRA RESPONSIBILITY ALLOWANCE', value: data.income.extraResponsibilityAllowance },
      { label: 'BIK/VOLA', value: data.income.bikVola },
      { label: 'OVERTIME', value: data.income.overtime }
    ];
    
    for (const field of incomeFields) {
      if (field.value && parseFloat(field.value) > 0) {
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = field.label;
        worksheet.getCell(`C${currentRow}`).value = formatMoney(field.value);
        worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'right' };
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      }
    }

    // Deduction items - start from the same row as income
    worksheet.getCell(`E${deductionRow}`).value = 'EPF';
    worksheet.getCell(`G${deductionRow}`).value = formatMoney(data.deduction.epfEmp);
    worksheet.getCell(`G${deductionRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`E${deductionRow}:F${deductionRow}`);
    worksheet.mergeCells(`G${deductionRow}:H${deductionRow}`);

    deductionRow++;
    worksheet.getCell(`E${deductionRow}`).value = 'SOCSO';
    worksheet.getCell(`G${deductionRow}`).value = formatMoney(data.deduction.socsoEmp);
    worksheet.getCell(`G${deductionRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`E${deductionRow}:F${deductionRow}`);
    worksheet.mergeCells(`G${deductionRow}:H${deductionRow}`);

    deductionRow++;
    worksheet.getCell(`E${deductionRow}`).value = 'EIS';
    worksheet.getCell(`G${deductionRow}`).value = formatMoney(data.deduction.eisEmp);
    worksheet.getCell(`G${deductionRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`E${deductionRow}:F${deductionRow}`);
    worksheet.mergeCells(`G${deductionRow}:H${deductionRow}`);

    // Set currentRow to the maximum of income and deduction rows
    currentRow = Math.max(currentRow, deductionRow) + 1;

    // Totals
    worksheet.getCell(`A${currentRow}`).value = 'TOTAL GROSS INCOME';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = formatMoney(data.income.totalGross);
    worksheet.getCell(`C${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);

    worksheet.getCell(`E${currentRow}`).value = 'TOTAL DEDUCTIONS';
    worksheet.getCell(`E${currentRow}`).font = { bold: true };
    worksheet.getCell(`G${currentRow}`).value = formatMoney(data.deduction.total);
    worksheet.getCell(`G${currentRow}`).font = { bold: true };
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);

    currentRow += 2;

    // Net Income
    worksheet.getCell(`A${currentRow}`).value = 'NET INCOME';
    worksheet.getCell(`A${currentRow}`).font = { size: 16, bold: true };
    worksheet.getCell(`G${currentRow}`).value = formatMoney(data.netIncome);
    worksheet.getCell(`G${currentRow}`).font = { size: 16, bold: true };
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);

    // Add borders for net income
    for (let col = 1; col <= 8; col++) {
      worksheet.getCell(currentRow, col).border = {
        top: { style: 'thick' },
        left: { style: 'thick' },
        bottom: { style: 'thick' },
        right: { style: 'thick' }
      };
    }

    currentRow += 3;

    // Employer Contributions
    worksheet.getCell(`A${currentRow}`).value = 'CURRENT MONTH EMPLOYER CONTRIBUTION';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);

    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'EPF';
    worksheet.getCell(`B${currentRow}`).value = formatMoney(data.employerContrib.epfEr);
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`D${currentRow}`).value = 'SOCSO';
    worksheet.getCell(`E${currentRow}`).value = formatMoney(data.employerContrib.socsoEr);
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`G${currentRow}`).value = 'EIS';
    worksheet.getCell(`H${currentRow}`).value = formatMoney(data.employerContrib.eisEr);
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

    currentRow += 2;

    // YTD Information
    worksheet.getCell(`A${currentRow}`).value = `YTD EMPLOYEE CONTRIBUTION: ${formatMoney(data.ytd.employee)} | YTD EMPLOYER CONTRIBUTION: ${formatMoney(data.ytd.employer)}`;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);

    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = `MTD: ${formatMoney(data.ytd.mtd)}`;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);

    // Set column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;

    // Generate file paths
    const fileName = `Payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.period.month}_${data.period.year}`;
    const excelPath = join(__dirname, '../exports', `${fileName}.xlsx`);
    const pdfPath = join(__dirname, '../exports', `${fileName}.pdf`);

    // Save Excel file
    await workbook.xlsx.writeFile(excelPath);
    console.log('Excel payslip generated:', excelPath);

    // For now, we'll return the Excel path. In a real implementation, you would use
    // LibreOffice or another tool to convert to PDF
    console.log('Excel file saved successfully. PDF conversion would require LibreOffice headless mode.');

    return {
      excelPath,
      pdfPath: excelPath // Return Excel path as PDF path for now
    };

  } catch (error) {
    console.error('Error generating Excel payslip:', error);
    throw error;
  }
}