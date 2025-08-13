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
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            padding: 20px;
            background: white;
            max-width: 210mm;
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
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            display: block;
            margin: 0;
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
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .company-addr {
            font-size: 12px;
            line-height: 1.35;
            margin-bottom: 12px;
        }
        
        .panel {
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
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
            margin: 2px 0;
        }
        
        .kv .k {
            width: 90px;
            color: #6B7280;
            font-weight: bold;
        }
        
        .kv .v {
            flex: 1;
            font-weight: 600;
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
            border-bottom: 1px solid #E5E7EB;
        }
        
        .tbl .rowi {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #F3F4F6;
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
            font-family: 'Courier New', monospace;
        }
        
        .net {
            margin-top: 12px;
            padding: 12px;
            border: 2px solid #059669;
            border-radius: 8px;
            font-weight: 800;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            background: #F0FDF4;
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

    <div class="confidential">STRICTLY PRIVATE &amp; CONFIDENTIAL</div>
    <div class="header-container">
        ${templateData.company.logoHTML || ''}
        <div class="company-info">
            <div class="company-name">${templateData.company.name}</div>
            <div class="company-reg">${templateData.company.regNo}</div>
            <div class="company-addr">${templateData.company.address}</div>
        </div>
    </div>

    <!-- Employee Info Panel -->
    <div class="panel">
        <div class="row">
            <div class="col">
                <div class="kv"><div class="k">NAME:</div><div class="v">${templateData.employee.name}</div></div>
                <div class="kv"><div class="k">I/C NO.:</div><div class="v">${templateData.employee.icNo || 'N/A'}</div></div>
                <div class="kv"><div class="k">POSITION:</div><div class="v">${templateData.employee.position}</div></div>
            </div>
            <div class="col">
                <div class="kv"><div class="k">MONTH:</div><div class="v">${templateData.period.month}</div></div>
                <div class="kv"><div class="k">YEAR:</div><div class="v">${templateData.period.year}</div></div>
            </div>
        </div>
    </div>

    <!-- Income & Deductions -->
    <div class="twocol">
        <!-- Income -->
        <div class="tbl">
            <div class="hd">INCOME</div>
            <div class="rowi">
                <span>Basic Salary</span>
                <span class="money">RM ${templateData.income.basic}</span>
            </div>
            ${templateData.income.items.filter((item: any) => item.show).map((item: any) => `
            <div class="rowi">
                <span>${item.label}</span>
                <span class="money">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div class="rowi sep">
                <span>TOTAL GROSS</span>
                <span class="money">RM ${templateData.income.totalGross}</span>
            </div>
        </div>

        <!-- Deductions -->
        <div class="tbl">
            <div class="hd">DEDUCTION</div>
            <div class="rowi">
                <span>EPF Employee (11%)</span>
                <span class="money">RM ${templateData.deduction.epfEmp}</span>
            </div>
            <div class="rowi">
                <span>SOCSO Employee (0.5%)</span>
                <span class="money">RM ${templateData.deduction.socsoEmp}</span>
            </div>
            <div class="rowi">
                <span>EIS Employee (0.2%)</span>
                <span class="money">RM ${templateData.deduction.eisEmp}</span>
            </div>
            ${templateData.deduction.items.filter((item: any) => item.show).map((item: any) => `
            <div class="rowi">
                <span>${item.label}</span>
                <span class="money">RM ${item.amount}</span>
            </div>
            `).join('')}
            <div class="rowi sep">
                <span>TOTAL DEDUCTION</span>
                <span class="money">RM ${templateData.deduction.total}</span>
            </div>
        </div>
    </div>

    <!-- Net Income -->
    <div class="net">
        <span>NET PAY</span>
        <span>RM ${templateData.netIncome}</span>
    </div>

    <!-- Employer Contributions -->
    <div class="section-title">EMPLOYER CONTRIBUTION</div>
    <div class="grid3">
        <div class="tbl">
            <div class="hd">EPF EMPLOYER</div>
            <div class="rowi">
                <span>12%</span>
                <span class="money">RM ${templateData.employerContrib.epfEr}</span>
            </div>
        </div>
        
        <div class="tbl">
            <div class="hd">SOCSO EMPLOYER</div>
            <div class="rowi">
                <span>1.75%</span>
                <span class="money">RM ${templateData.employerContrib.socsoEr}</span>
            </div>
        </div>
        
        <div class="tbl">
            <div class="hd">EIS EMPLOYER</div>
            <div class="rowi">
                <span>0.2%</span>
                <span class="money">RM ${templateData.employerContrib.eisEr}</span>
            </div>
        </div>
    </div>

    <!-- YTD Summary -->
    <div class="hr"></div>
    <div class="section-title">YEAR TO DATE SUMMARY</div>
    <div class="twocol">
        <div class="tbl">
            <div class="hd">EMPLOYEE CONTRIBUTION YTD</div>
            <div class="rowi">
                <span>EPF Employee</span>
                <span class="money">RM ${templateData.ytd.breakdown.epfEmployee || "0.00"}</span>
            </div>
            <div class="rowi">
                <span>SOCSO Employee</span>
                <span class="money">RM ${templateData.ytd.breakdown.socsoEmployee || "0.00"}</span>
            </div>
            <div class="rowi">
                <span>EIS Employee</span>
                <span class="money">RM ${templateData.ytd.breakdown.eisEmployee || "0.00"}</span>
            </div>
            <div class="rowi">
                <span>PCB/MTD</span>
                <span class="money">RM ${templateData.ytd.breakdown.pcb || "0.00"}</span>
            </div>
            <div class="rowi">
                <span style="font-weight: bold;">Total Employee YTD</span>
                <span class="money" style="font-weight: bold;">RM ${templateData.ytd.employee}</span>
            </div>
        </div>
        
        <div class="tbl">
            <div class="hd">EMPLOYER CONTRIBUTION YTD</div>
            <div class="rowi">
                <span>EPF Employer</span>
                <span class="money">RM ${templateData.ytd.breakdown.epfEmployer || "0.00"}</span>
            </div>
            <div class="rowi">
                <span>SOCSO Employer</span>
                <span class="money">RM ${templateData.ytd.breakdown.socsoEmployer || "0.00"}</span>
            </div>
            <div class="rowi">
                <span>EIS Employer</span>
                <span class="money">RM ${templateData.ytd.breakdown.eisEmployer || "0.00"}</span>
            </div>
            <div class="rowi">
                <span style="font-weight: bold;">Total Employer YTD</span>
                <span class="money" style="font-weight: bold;">RM ${templateData.ytd.employer}</span>
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