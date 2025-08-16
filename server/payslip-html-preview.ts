// HTML Preview Generator for Payslip (sama layout macam PDF tapi HTML)
export function generatePayslipHTML(templateData: any, showPreviewNote: boolean = true): string {
  return `
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Slip Gaji - ${templateData.employee.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            padding: 15px;
            background: white;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .confidential {
            font-size: 10px;
            text-transform: uppercase;
            float: right;
            color: #666;
            margin-bottom: 10px;
        }
        
        .header-container {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ccc;
        }
        
        .company-logo {
            width: 42px;
            height: 42px;
            object-fit: contain;
            display: block;
            margin: 0 8px 0 0;
            border: none;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 4px;
        }
        
        .company-reg {
            font-size: 16px;
            margin-bottom: 4px;
        }
        
        .company-addr {
            font-size: 14px;
            line-height: 1.35;
            margin-bottom: 12px;
        }
        
        .panel {
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 14px;
            background: #F9FAFB;
        }
        
        .row {
            display: flex;
            gap: 16px;
        }
        
        .col {
            flex: 1;
        }
        
        .kv {
            display: flex;
            gap: 8px;
            margin: 6px 0;
        }
        
        .kv .k {
            width: 70px;
            color: #666;
            font-weight: bold;
            font-size: 11px;
            flex-shrink: 0;
        }
        
        .kv .v {
            flex: 1;
            font-weight: bold;
            font-size: 11px;
        }
        
        .section-title {
            color: #6B7280;
            font-weight: 700;
            margin: 14px 0 6px;
            font-size: 13px;
        }
        
        .tbl {
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        
        .tbl .hd {
            background: #F9FAFB;
            padding: 10px 12px;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .tbl .rowi {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 12px;
            border-bottom: 1px solid #F3F4F6;
            font-size: 11px;
        }
        
        .tbl .rowi:last-child {
            border-bottom: none;
        }
        
        .tbl .sep {
            border-top: 1px solid #E5E7EB;
            margin-top: 4px;
            padding-top: 8px;
            font-weight: 700;
            background: #F3F4F6;
        }
        
        .money {
            text-align: right;
            min-width: 120px;
            font-weight: bold;
            font-size: 11px;
        }
        
        .net {
            margin: 14px 0;
            padding: 12px;
            border: 2px solid #28a745;
            border-radius: 6px;
            font-weight: 700;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            background: #d4edda;
            text-transform: uppercase;
        }
        
        .twocol {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        
        .grid3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
        }
        
        .hr {
            border-top: 1px solid #E5E7EB;
            margin: 12px 0;
        }
        
        .preview-note {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 11px;
            text-align: center;
            color: #92400E;
        }
    </style>
</head>
<body>
    ${showPreviewNote ? `<div class="preview-note">
        📄 PREVIEW SLIP GAJI - Format sama seperti PDF yang akan dijana
    </div>` : ''}

    <!-- Header Section - Match PDF exactly -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ccc;">
        <div style="display: flex; align-items: flex-start; gap: 8px; max-width: 70%;">
            ${templateData.company.logoHTML || ''}
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 18px; margin-bottom: 4px;">${templateData.company.name}</div>
                <div style="font-size: 16px; margin-bottom: 4px;">${templateData.company.regNo}</div>
                <div style="font-size: 14px; line-height: 1.35; margin-bottom: 12px;">${templateData.company.address}</div>
            </div>
        </div>
        <div style="font-size: 10px; text-transform: uppercase; color: #666; margin-top: 0;">STRICTLY PRIVATE &amp; CONFIDENTIAL</div>
    </div>

    <!-- Employee Info Panel - Match PDF Exactly -->
    <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; margin-bottom: 14px; background: #F9FAFB;">
        <div style="display: flex; width: 100%;">
            <!-- Left Section: Employee Info -->
            <div style="width: 50%; padding-right: 10px;">
                <div style="display: flex; gap: 8px; margin: 6px 0;">
                    <div style="width: 70px; color: #666; font-weight: bold; font-size: 11px;">NAME:</div>
                    <div style="flex: 1; font-weight: bold; font-size: 11px;">${templateData.employee.name}</div>
                </div>
                <div style="display: flex; gap: 8px; margin: 6px 0;">
                    <div style="width: 70px; color: #666; font-weight: bold; font-size: 11px;">I/C NO.:</div>
                    <div style="flex: 1; font-weight: bold; font-size: 11px;">${templateData.employee.icNo || 'N/A'}</div>
                </div>
                <div style="display: flex; gap: 8px; margin: 6px 0;">
                    <div style="width: 70px; color: #666; font-weight: bold; font-size: 11px;">POSITION:</div>
                    <div style="flex: 1; font-weight: bold; font-size: 11px;">${templateData.employee.position}</div>
                </div>
            </div>
            
            <!-- Right Section: Period Info -->
            <div style="width: 50%; padding-left: 10px;">
                <div style="display: flex; gap: 8px; margin: 6px 0;">
                    <div style="width: 70px; color: #666; font-weight: bold; font-size: 11px;">MONTH:</div>
                    <div style="flex: 1; font-weight: bold; font-size: 11px;">${templateData.period.month}</div>
                </div>
                <div style="display: flex; gap: 8px; margin: 6px 0;">
                    <div style="width: 70px; color: #666; font-weight: bold; font-size: 11px;">YEAR:</div>
                    <div style="flex: 1; font-weight: bold; font-size: 11px;">${templateData.period.year}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Income & Deductions - Match PDF Layout -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
        <!-- Income Box -->
        <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; background: #F8F9FA;">
            <div style="background: #F9FAFB; padding: 10px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">INCOME</div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>Basic Salary</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.income.basic}</span>
            </div>
            ${templateData.income.items.filter((item: any) => item.show).map((item: any) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>${item.label}</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-top: 1px solid #E5E7EB; margin-top: 4px; font-weight: 700; background: #F3F4F6; font-size: 11px;">
                <span>TOTAL GROSS</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.income.totalGross}</span>
            </div>
        </div>

        <!-- Deductions Box -->
        <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; background: #F8F9FA;">
            <div style="background: #F9FAFB; padding: 10px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">DEDUCTIONS</div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EPF</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.deduction.epfEmp}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>SOCSO</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.deduction.socsoEmp}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EIS</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.deduction.eisEmp}</span>
            </div>
            ${templateData.deduction.items.filter((item: any) => item.show).map((item: any) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>${item.label}</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-top: 1px solid #E5E7EB; margin-top: 4px; font-weight: 700; background: #F3F4F6; font-size: 11px;">
                <span>TOTAL DEDUCTIONS</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.deduction.total}</span>
            </div>
        </div>
    </div>

    <!-- Net Income - Match PDF Style -->
    <div style="margin: 14px 0; padding: 12px; border: 2px solid #28a745; border-radius: 6px; font-weight: 700; font-size: 16px; display: flex; justify-content: space-between; background: #d4edda; text-transform: uppercase;">
        <span>NET INCOME</span>
        <span>RM ${templateData.netIncome}</span>
    </div>

    <!-- Employer Contributions - Match PDF Layout -->
    <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; margin-bottom: 14px; background: #F8F9FA;">
        <div style="background: #F9FAFB; padding: 10px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">EMPLOYER CONTRIBUTIONS</div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
            <span>EPF</span>
            <span style="text-align: right; min-width: 100px; font-weight: bold; font-size: 11px;">RM ${templateData.employerContrib.epfEr}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
            <span>SOCSO</span>
            <span style="text-align: right; min-width: 100px; font-weight: bold; font-size: 11px;">RM ${templateData.employerContrib.socsoEr}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
            <span>EIS</span>
            <span style="text-align: right; min-width: 100px; font-weight: bold; font-size: 11px;">RM ${templateData.employerContrib.eisEr}</span>
        </div>
    </div>

    <!-- YTD Summary - Match PDF Layout -->
    <div style="border-top: 1px solid #E5E7EB; margin: 12px 0; padding-top: 12px;"></div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
        <!-- Employee YTD -->
        <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; background: #F8F9FA;">
            <div style="background: #F9FAFB; padding: 10px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">CURRENT MONTH NET PAY YTD BALANCE</div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EPF</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.epfEmployee || "0.00"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>SOCSO</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.socsoEmployee || "0.00"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EIS</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.eisEmployee || "0.00"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>PCB/MTD</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.pcb || "0.00"}</span>
            </div>
        </div>
        
        <!-- Employer YTD -->
        <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; background: #F8F9FA;">
            <div style="background: #F9FAFB; padding: 10px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">EMPLOYER CONTRIBUTIONS</div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EPF</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.epfEmployer || "0.00"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>SOCSO</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.socsoEmployer || "0.00"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #F3F4F6; font-size: 11px;">
                <span>EIS</span>
                <span style="text-align: right; min-width: 80px; font-weight: bold; font-size: 11px;">RM ${templateData.ytd.breakdown.eisEmployer || "0.00"}</span>
            </div>
        </div>
    </div>

    <div class="hr"></div>
    <div style="text-align: center; font-size: 10px; color: #6B7280; margin-top: 20px;">
        Dokumen ini dijana secara automatik dan tidak memerlukan tandatangan.<br/>
        Generated on: ${new Date().toLocaleDateString('ms-MY')}
    </div>
</body>
</html>
  `;
}