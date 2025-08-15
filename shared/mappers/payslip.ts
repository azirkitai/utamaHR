import { toNum } from "../utils/amount";

// Flexible DB data structure types
type DbItem = { label: string; amount: number | string };

type DbSlip = {
  employee: { fullName: string; ic?: string; position?: string };
  period: { month: string; year: number };
  company?: { name?: string; regNumber?: string; address?: string };
  // EITHER object fields...
  income?: {
    basicSalary?: number | string;
    overtime?: number | string;
    fixedAllowance?: number | string;
    additional?: DbItem[];
  };
  deductions?: {
    epfEmployee?: number | string;
    socsoEmployee?: number | string;
    eisEmployee?: number | string;
    pcb?: number | string;
    additional?: DbItem[];
  };
  contributions?: {
    epfEmployer?: number | string;
    socsoEmployer?: number | string;
    eisEmployer?: number | string;
  };
  ytd?: {
    employee?: { epf?: number | string; socso?: number | string; eis?: number | string; pcb?: number | string };
    employer?: { epf?: number | string; socso?: number | string; eis?: number | string };
  };
  // ...OR arrays (if your system stores this way)
  incomesArray?: DbItem[];
  deductionsArray?: DbItem[];
  employerContribArray?: DbItem[];
  ytdEmployeeArray?: DbItem[];
  ytdEmployerArray?: DbItem[];
};

export function mapDbToPayslipProps(db: DbSlip) {
  // 1) INCOME
  const incomeList: DbItem[] = [];
  if (db.incomesArray?.length) {
    incomeList.push(...db.incomesArray);
  } else if (db.income) {
    if (db.income.basicSalary !== undefined) incomeList.push({ label: "Basic Salary", amount: db.income.basicSalary });
    if (db.income.overtime) incomeList.push({ label: "Overtime", amount: db.income.overtime });
    if (db.income.fixedAllowance) incomeList.push({ label: "FIXED ALLOWENCE", amount: db.income.fixedAllowance });
    if (db.income.additional?.length) incomeList.push(...db.income.additional);
  }

  // 2) DEDUCTION
  const deductionList: DbItem[] = [];
  console.log('=== MAPPER DEDUCTION DEBUG ===');
  console.log('db.deductions:', JSON.stringify(db.deductions));
  console.log('db.deductions.pcb value:', db.deductions?.pcb);
  console.log('db.deductions.pcb type:', typeof db.deductions?.pcb);
  
  if (db.deductionsArray?.length) {
    deductionList.push(...db.deductionsArray);
  } else if (db.deductions) {
    if (db.deductions.epfEmployee) deductionList.push({ label: "EPF Employee", amount: db.deductions.epfEmployee });
    if (db.deductions.socsoEmployee) deductionList.push({ label: "SOCSO Employee", amount: db.deductions.socsoEmployee });
    if (db.deductions.eisEmployee) deductionList.push({ label: "EIS Employee", amount: db.deductions.eisEmployee });
    
    // Debug PCB condition
    const pcbCondition1 = db.deductions.pcb !== undefined;
    const pcbCondition2 = db.deductions.pcb > 0;
    console.log('PCB condition 1 (not undefined):', pcbCondition1);
    console.log('PCB condition 2 (> 0):', pcbCondition2);
    console.log('PCB condition combined:', pcbCondition1 && pcbCondition2);
    
    // REMOVE PCB logic here to avoid duplication - handled in server side additional items
    // MTD/PCB will be added via templateData.deduction.additional to avoid duplication
    console.log('❌ MTD/PCB NOT added to deduction list - handled in server additional items');
    
    if (db.deductions.additional?.length) deductionList.push(...db.deductions.additional);
  }
  console.log('Final deductionList:', JSON.stringify(deductionList));
  console.log('=== END MAPPER DEDUCTION DEBUG ===');

  // 3) Employer contrib
  const employerContrib: DbItem[] = db.employerContribArray?.length
    ? db.employerContribArray
    : [
        db.contributions?.epfEmployer !== undefined && { label: "EPF EMPLOYER", amount: db.contributions?.epfEmployer },
        db.contributions?.socsoEmployer !== undefined && { label: "SOCSO EMPLOYER", amount: db.contributions?.socsoEmployer },
        db.contributions?.eisEmployer !== undefined && { label: "EIS EMPLOYER", amount: db.contributions?.eisEmployer },
      ].filter(Boolean) as DbItem[];

  // 4) YTD
  const ytdEmployee: DbItem[] = db.ytdEmployeeArray?.length
    ? db.ytdEmployeeArray
    : [
        db.ytd?.employee?.epf !== undefined && { label: "EPF Employee", amount: db.ytd?.employee?.epf },
        db.ytd?.employee?.socso !== undefined && { label: "SOCSO Employee", amount: db.ytd?.employee?.socso },
        db.ytd?.employee?.eis !== undefined && { label: "EIS Employee", amount: db.ytd?.employee?.eis },
        db.ytd?.employee?.pcb !== undefined && { label: "PCB/MTD", amount: db.ytd?.employee?.pcb },
      ].filter(Boolean) as DbItem[];

  const ytdEmployer: DbItem[] = db.ytdEmployerArray?.length
    ? db.ytdEmployerArray
    : [
        db.ytd?.employer?.epf !== undefined && { label: "EPF Employer", amount: db.ytd?.employer?.epf },
        db.ytd?.employer?.socso !== undefined && { label: "SOCSO Employer", amount: db.ytd?.employer?.socso },
        db.ytd?.employer?.eis !== undefined && { label: "EIS Employer", amount: db.ytd?.employer?.eis },
      ].filter(Boolean) as DbItem[];

  // 5) Calculate totals if not provided
  const gross = incomeList.reduce((s, x) => s + toNum(x.amount), 0);
  const totalDeduction = deductionList.reduce((s, x) => s + toNum(x.amount), 0);
  const netPay = gross - totalDeduction;

  return {
    employee: db.employee,
    document: db.period,
    company: db.company ?? {},
    payroll: {
      incomes: incomeList,
      deductions: deductionList,
      gross,
      totalDeduction,
      netPay,
      employerContrib,
      ytdEmployee,
      ytdEmployer,
    },
  };
}