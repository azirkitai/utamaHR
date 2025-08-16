// Simple HTML Preview Generator matching PDF layout exactly
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
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            padding: 15px;
            background: white;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .preview-note {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 4px;
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

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #ccc;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
            ${templateData.company.logoHTML || ''}
            <div>
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 2px;">${templateData.company.name}</div>
                <div style="font-size: 12px; margin-bottom: 2px;">${templateData.company.regNo}</div>
                <div style="font-size: 10px; line-height: 1.3; color: #555;">${templateData.company.address}</div>
            </div>
        </div>
        <div style="font-size: 9px; text-transform: uppercase; color: #666; text-align: right;">STRICTLY PRIVATE &<br>CONFIDENTIAL</div>
    </div>

    <!-- Employee Info -->
    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin-bottom: 12px; background: #f9f9f9;">
        <div style="display: flex;">
            <div style="width: 50%; padding-right: 10px;">
                <div style="display: flex; margin: 3px 0;">
                    <span style="width: 60px; font-weight: bold; font-size: 10px;">NAME:</span>
                    <span style="font-size: 10px; font-weight: bold;">${templateData.employee.name}</span>
                </div>
                <div style="display: flex; margin: 3px 0;">
                    <span style="width: 60px; font-weight: bold; font-size: 10px;">I/C NO.:</span>
                    <span style="font-size: 10px;">${templateData.employee.icNo || 'N/A'}</span>
                </div>
                <div style="display: flex; margin: 3px 0;">
                    <span style="width: 60px; font-weight: bold; font-size: 10px;">POSITION:</span>
                    <span style="font-size: 10px;">${templateData.employee.position}</span>
                </div>
            </div>
            <div style="width: 50%; padding-left: 10px;">
                <div style="display: flex; margin: 3px 0;">
                    <span style="width: 60px; font-weight: bold; font-size: 10px;">MONTH:</span>
                    <span style="font-size: 10px;">${templateData.period.month}</span>
                </div>
                <div style="display: flex; margin: 3px 0;">
                    <span style="width: 60px; font-weight: bold; font-size: 10px;">YEAR:</span>
                    <span style="font-size: 10px;">${templateData.period.year}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Income & Deductions -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <!-- Income -->
        <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            <div style="background: #f0f0f0; padding: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd;">INCOME</div>
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>Basic Salary</span>
                <span style="font-weight: bold;">RM ${templateData.income.basic}</span>
            </div>
            ${templateData.income.items.filter((item: any) => item.show).map((item: any) => `
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>${item.label}</span>
                <span style="font-weight: bold;">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div style="padding: 8px; background: #f0f0f0; display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
                <span>TOTAL GROSS</span>
                <span>RM ${templateData.income.totalGross}</span>
            </div>
        </div>

        <!-- Deductions -->
        <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            <div style="background: #f0f0f0; padding: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd;">DEDUCTIONS</div>
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>EPF</span>
                <span style="font-weight: bold;">RM ${templateData.deduction.epfEmp}</span>
            </div>
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>SOCSO</span>
                <span style="font-weight: bold;">RM ${templateData.deduction.socsoEmp}</span>
            </div>
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>EIS</span>
                <span style="font-weight: bold;">RM ${templateData.deduction.eisEmp}</span>
            </div>
            ${templateData.deduction.items.filter((item: any) => item.show).map((item: any) => `
            <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                <span>${item.label}</span>
                <span style="font-weight: bold;">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div style="padding: 8px; background: #f0f0f0; display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
                <span>TOTAL DEDUCTIONS</span>
                <span>RM ${templateData.deduction.total}</span>
            </div>
        </div>
    </div>

    <!-- Net Income -->
    <div style="border: 2px solid #28a745; border-radius: 4px; padding: 12px; margin: 12px 0; background: #d4edda; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
        <span>NET INCOME</span>
        <span>RM ${templateData.netIncome}</span>
    </div>

    <!-- Employer Contributions -->
    <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
        <div style="background: #f0f0f0; padding: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd;">EMPLOYER CONTRIBUTIONS</div>
        <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
            <span>EPF</span>
            <span style="font-weight: bold;">RM ${templateData.employerContrib.epfEr}</span>
        </div>
        <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
            <span>SOCSO</span>
            <span style="font-weight: bold;">RM ${templateData.employerContrib.socsoEr}</span>
        </div>
        <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
            <span>EIS</span>
            <span style="font-weight: bold;">RM ${templateData.employerContrib.eisEr}</span>
        </div>
    </div>

    <!-- YTD Summary -->
    <div style="border-top: 1px solid #ddd; padding-top: 10px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <!-- Employee YTD -->
            <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                <div style="background: #f0f0f0; padding: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd;">CURRENT MONTH NET PAY YTD BALANCE</div>
                <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>EPF</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.epfEmployee || "0.00"}</span>
                </div>
                <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>SOCSO</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.socsoEmployee || "0.00"}</span>
                </div>
                <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>EIS</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.eisEmployee || "0.00"}</span>
                </div>
                <div style="padding: 6px 8px; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>PCB/MTD</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.pcb || "0.00"}</span>
                </div>
            </div>
            
            <!-- Employer YTD -->
            <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                <div style="background: #f0f0f0; padding: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd;">EMPLOYER CONTRIBUTIONS</div>
                <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>EPF</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.epfEmployer || "0.00"}</span>
                </div>
                <div style="padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>SOCSO</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.socsoEmployer || "0.00"}</span>
                </div>
                <div style="padding: 6px 8px; display: flex; justify-content: space-between; font-size: 10px;">
                    <span>EIS</span>
                    <span style="font-weight: bold;">RM ${templateData.ytd.breakdown.eisEmployer || "0.00"}</span>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
  `;
}