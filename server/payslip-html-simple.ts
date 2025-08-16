export function generatePayslipHTML(data: any): string {
  // Copy exact utility functions from PDF
  const toNum = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const toFixed2 = (v: unknown) => toNum(v).toFixed(2);
  const formatRM = (v: unknown) => `RM ${toFixed2(v)}`;

  // Show preview note - PRESERVED
  const showPreviewNote = data.showPreviewNote !== false;
  console.log(`TIMESTAMP: ${new Date().toISOString()}`);
  console.log(`showPreviewNote: ${showPreviewNote}`);

  // Debug values
  const hrdfValue = data.employerContrib?.hrdfEr || "0.00";
  console.log(`HRDF VALUE IN TEMPLATE: ${hrdfValue}`);
  console.log(`NET PAY VALUE: ${data.netIncome || '0.00'}`);
  console.log(`FULL YTD BREAKDOWN:`, JSON.stringify(data.ytd?.breakdown || {}, null, 2));

  // EXACT PDF LOGIC COPY - Fallback logic for basic salary
  const sumAdditional = (arr?: Array<{amount: any}>) => 
    (arr || []).reduce((s, a) => s + toNum(a?.amount), 0);
  
  const incomeOthers = toNum(data.income?.overtime) + toNum(data.income?.fixedAllowance) + sumAdditional(data.income?.additional);
  
  // If basicSalary is missing/0, derive: gross - (overtime + fixed + additional)
  const basicForDisplay = toNum(data.income?.basicSalary) || Math.max(0, toNum(data.income?.totalGross) - incomeOthers);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.4;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
      font-size: 11px;
    }

    .payslip {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ccc;
    }

    .company-info {
      display: flex;
      align-items: flex-start;
      max-width: 70%;
    }

    .company-logo {
      width: 42px;
      height: 42px;
      margin-right: 8px;
      object-fit: contain;
    }

    .company-name {
      font-size: 18px;
      font-weight: 700;
    }

    .company-reg {
      font-size: 12px;
      margin-top: 2px;
    }

    .company-address {
      font-size: 10px;
      line-height: 1.3;
      margin-top: 2px;
      max-width: 300px;
    }

    .confidential {
      font-size: 10px;
      color: #666;
    }

    .employee-section {
      background-color: #f8f9fa;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #e9ecef;
      border-radius: 6px;
    }

    .employee-row {
      display: flex;
      width: 100%;
    }

    .employee-left, .employee-right {
      width: 50%;
    }

    .employee-left {
      padding-right: 10px;
    }

    .employee-right {
      padding-left: 10px;
    }

    .employee-item {
      display: flex;
      margin-bottom: 6px;
      flex-wrap: nowrap;
    }

    .employee-label {
      width: 70px;
      font-size: 11px;
      font-weight: 700;
      color: #666;
      flex-shrink: 0;
    }

    .employee-value {
      font-size: 11px;
      color: #333;
    }

    .income-deductions {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }

    .income-box, .deductions-box {
      flex: 1;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 12px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 10px;
      text-transform: uppercase;
      color: #666;
    }

    .line-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
    }

    .line-item-label {
      color: #333;
    }

    .line-item-amount {
      font-weight: 700;
      color: #333;
    }

    .total-line {
      border-top: 2px solid #333;
      padding-top: 8px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 12px;
    }

    .net-pay {
      background-color: #e9ecef;
      border: 2px solid #6c757d;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 14px;
    }

    .net-pay-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .net-pay-label {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .net-pay-amount {
      font-size: 18px;
      font-weight: 700;
    }

    .contributions {
      margin-bottom: 14px;
    }

    .contributions-title {
      font-size: 12px;
      font-weight: 700;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .contrib-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }

    .contrib-row-additional {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .contrib-box {
      flex: 1;
      border: 1px solid #e9ecef;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .contrib-label {
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .contrib-amount {
      font-size: 12px;
      font-weight: 700;
    }

    .ytd-section {
      margin-bottom: 16px;
    }

    .ytd-title {
      font-size: 12px;
      font-weight: 700;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .ytd-row {
      display: flex;
      gap: 8px;
    }

    .ytd-box {
      flex: 1;
      border: 1px solid #e9ecef;
      padding: 10px;
      border-radius: 6px;
    }

    .ytd-box-title {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .ytd-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .ytd-label {
      font-size: 10px;
    }

    .ytd-amount {
      font-size: 10px;
      font-weight: 700;
    }

    .preview-note {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 12px;
    }

    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 9px;
      color: #666;
      border-top: 1px solid #e9ecef;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="payslip">
    ${showPreviewNote ? `
    <div class="preview-note">
      <strong>PREVIEW MODE</strong> - Ini adalah paparan preview sahaja
    </div>
    ` : ''}

    <!-- Header (EXACT PDF COPY) -->
    <div class="header">
      <div class="company-info">
        ${data.company?.logoUrl ? `<img src="${data.company.logoUrl}" alt="Company Logo" class="company-logo">` : ''}
        <div>
          <div class="company-name">${data.company?.name || 'UTAMA MEDGROUP SDN BHD'}</div>
          <div class="company-reg">${data.company?.regNo || '202201033996(1479693-H)'}</div>
          <div class="company-address">${data.company?.address || 'A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR'}</div>
        </div>
      </div>
      <div class="confidential">STRICTLY PRIVATE & CONFIDENTIAL</div>
    </div>

    <!-- Employee Info (EXACT PDF COPY) -->
    <div class="employee-section">
      <div class="employee-row">
        <div class="employee-left">
          <div class="employee-item">
            <div class="employee-label">NAME:</div>
            <div class="employee-value">${data.employee?.fullName || 'N/A'}</div>
          </div>
          <div class="employee-item">
            <div class="employee-label">I/C NO.:</div>
            <div class="employee-value">${data.employee?.ic || 'N/A'}</div>
          </div>
          <div class="employee-item">
            <div class="employee-label">POSITION:</div>
            <div class="employee-value">${data.employee?.position || 'Employee'}</div>
          </div>
        </div>
        <div class="employee-right">
          <div class="employee-item">
            <div class="employee-label">MONTH:</div>
            <div class="employee-value">${data.period?.month || 'N/A'}</div>
          </div>
          <div class="employee-item">
            <div class="employee-label">YEAR:</div>
            <div class="employee-value">${data.period?.year || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Income vs Deductions (EXACT PDF COPY) -->
    <div class="income-deductions">
      <!-- Income Box -->
      <div class="income-box">
        <div class="section-title">INCOME</div>
        
        <!-- Basic Salary - using fallback logic FROM PDF -->
        <div class="line-item">
          <div class="line-item-label">Basic Salary</div>
          <div class="line-item-amount">${formatRM(basicForDisplay)}</div>
        </div>

        <!-- Other income items (EXACT PDF COPY) -->
        ${toNum(data.income?.overtime) > 0 ? `
        <div class="line-item">
          <div class="line-item-label">Overtime</div>
          <div class="line-item-amount">${formatRM(data.income?.overtime)}</div>
        </div>` : ''}

        ${toNum(data.income?.fixedAllowance) > 0 ? `
        <div class="line-item">
          <div class="line-item-label">Fixed Allowance</div>
          <div class="line-item-amount">${formatRM(data.income?.fixedAllowance)}</div>
        </div>` : ''}

        <!-- Additional income items (EXACT PDF COPY) -->
        ${(data.income?.additional || []).map((item: any) => 
          toNum(item.amount) > 0 ? `
          <div class="line-item">
            <div class="line-item-label">${item.label}</div>
            <div class="line-item-amount">${formatRM(item.amount)}</div>
          </div>` : ''
        ).join('')}

        <div class="total-line">
          <div>TOTAL GROSS</div>
          <div>${formatRM(data.income?.totalGross)}</div>
        </div>
      </div>

      <!-- Deductions Box (EXACT PDF COPY) -->
      <div class="deductions-box">
        <div class="section-title">DEDUCTIONS</div>
        
        <div class="line-item">
          <div class="line-item-label">EPF</div>
          <div class="line-item-amount">${formatRM(data.deduction?.epfEmp)}</div>
        </div>
        
        <div class="line-item">
          <div class="line-item-label">SOCSO</div>
          <div class="line-item-amount">${formatRM(data.deduction?.socsoEmp)}</div>
        </div>
        
        <div class="line-item">
          <div class="line-item-label">EIS</div>
          <div class="line-item-amount">${formatRM(data.deduction?.eisEmp)}</div>
        </div>

        <!-- PCB/MTD (EXACT PDF COPY) -->
        ${toNum(data.deduction?.other) > 0 ? `
        <div class="line-item">
          <div class="line-item-label">MTD/PCB</div>
          <div class="line-item-amount">${formatRM(data.deduction?.other)}</div>
        </div>` : ''}

        <!-- Additional deduction items (EXACT PDF COPY) -->
        ${(data.deduction?.additional || []).map((item: any) => 
          toNum(item.amount) > 0 ? `
          <div class="line-item">
            <div class="line-item-label">${item.label}</div>
            <div class="line-item-amount">${formatRM(item.amount)}</div>
          </div>` : ''
        ).join('')}

        <div class="total-line">
          <div>TOTAL DEDUCTIONS</div>
          <div>${formatRM(data.deduction?.total)}</div>
        </div>
      </div>
    </div>

    <!-- Net Pay (EXACT PDF COPY) -->
    <div class="net-pay">
      <div class="net-pay-row">
        <div class="net-pay-label">NET PAY</div>
        <div class="net-pay-amount">${formatRM(data.netIncome)}</div>
      </div>
    </div>

    <!-- Employer Contributions (EXACT PDF COPY) -->
    <div class="contributions">
      <div class="contributions-title">Current Month Employer Contribution</div>
      <div class="contrib-row">
        <div class="contrib-box">
          <div class="contrib-label">EPF</div>
          <div class="contrib-amount">${formatRM(data.employerContrib?.epfEr)}</div>
        </div>
        <div class="contrib-box">
          <div class="contrib-label">SOCSO</div>
          <div class="contrib-amount">${formatRM(data.employerContrib?.socsoEr)}</div>
        </div>
        <div class="contrib-box">
          <div class="contrib-label">EIS</div>
          <div class="contrib-amount">${formatRM(data.employerContrib?.eisEr)}</div>
        </div>
      </div>

      <!-- Additional Employer Contributions (EXACT PDF COPY) -->
      ${toNum(data.employerContrib?.hrdfEr) > 0.01 ? `
      <div class="contrib-row-additional">
        <div class="contrib-box">
          <div class="contrib-label">HRDF</div>
          <div class="contrib-amount">${formatRM(data.employerContrib?.hrdfEr)}</div>
        </div>
      </div>` : ''}
    </div>

    <!-- YTD Summary (EXACT PDF COPY) -->
    <div class="ytd-section">
      <div class="ytd-title">Year To Date (YTD) Breakdown</div>
      <div class="ytd-row">
        <div class="ytd-box">
          <div class="ytd-box-title">Employee Contribution (YTD)</div>
          ${parseFloat(data.ytd?.breakdown?.epfEmployee || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">EPF</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.epfEmployee)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.socsoEmployee || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">SOCSO</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.socsoEmployee)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.eisEmployee || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">EIS</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.eisEmployee)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.pcb || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">PCB</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.pcb)}</div>
          </div>` : ''}
        </div>
        
        <div class="ytd-box">
          <div class="ytd-box-title">Employer Contribution (YTD)</div>
          ${parseFloat(data.ytd?.breakdown?.epfEmployer || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">EPF</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.epfEmployer)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.socsoEmployer || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">SOCSO</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.socsoEmployer)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.eisEmployer || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">EIS</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.eisEmployer)}</div>
          </div>` : ''}
          ${parseFloat(data.ytd?.breakdown?.hrdfEmployer || 0) > 0.01 ? `
          <div class="ytd-item">
            <div class="ytd-label">HRDF</div>
            <div class="ytd-amount">${formatRM(data.ytd?.breakdown?.hrdfEmployer)}</div>
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Footer (EXACT PDF COPY) -->
    <div class="footer">
      Generated on: ${new Date().toISOString()}
    </div>
  </div>

  <script>
    console.log('=== PAYSLIP HTML GENERATED SUCCESSFULLY ===');
    console.log('HTML length:', document.body.innerHTML.length);
  </script>
</body>
</html>
  `;
}