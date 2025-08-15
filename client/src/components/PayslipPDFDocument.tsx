// PayslipPDFDocument.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* ===================== Utils (parse & format) ===================== */
const toNum = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const toFixed2 = (v: unknown) => toNum(v).toFixed(2);
const formatRM = (v: unknown) => `RM ${toFixed2(v)}`;

/* ============================ Types =============================== */
type AmountItem = { label: string; amount: number | string };

export interface PayslipPDFProps {
  employee: {
    fullName: string;
    employeeNo?: string;
    ic?: string;
    id?: string;
    position?: string;
  };
  document: {
    month: string;
    year: number | string;
    id?: string;
  };
  company?: {
    name?: string;
    regNumber?: string;
    address?: string;
    logoUrl?: string;
    confidentialityText?: string;
  };
  payroll: {
    grossPay: number | string;
    totalDeductions: number | string;
    netPay: number | string;
  };
  income?: {
    basicSalary?: number | string;
    overtime?: number | string;
    fixedAllowance?: number | string;
    additional?: Array<{ label: string; amount: number | string }>;
  };
  deductions?: {
    epfEmployee?: number | string;
    socsoEmployee?: number | string;
    eisEmployee?: number | string;
    pcb?: number | string;
    additional?: Array<{ label: string; amount: number | string }>;
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
  generated: string;
}

/* ===== Mapper: templateData/DB  →  props komponen ===== */
export function buildPdfPropsFromTemplateData(templateData: any): PayslipPDFProps {
  // Helper to parse amounts from template data (handles "3,500.00" strings)
  const parseAmount = (value: any): number => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(/,/g, '')) || 0;
    }
    return parseFloat(value) || 0;
  };

  // Extract basic salary from various possible locations
  const basicSalary = parseAmount(
    templateData.income?.basic || 
    templateData.salary?.basic || 
    templateData.salary?.basicSalary || 
    0
  );

  // Parse additional income items
  const additionalIncomeItems = (templateData.income?.items || [])
    .filter((item: any) => item.label !== 'Basic Salary') // Exclude Basic Salary from additional items
    .map((item: any) => ({
      label: item.label,
      amount: parseAmount(item.amount)
    }));

  // Parse additional deduction items from template data
  const additionalDeductionItems = [
    ...(templateData.deduction?.additional || []),
    ...(templateData.deduction?.items || [])
  ].map((item: any) => ({
    label: item.label,
    amount: parseAmount(item.amount)
  }));

  return {
    employee: {
      fullName: templateData.employee?.name || '',
      ic: templateData.employee?.icNo || '',
      position: templateData.employee?.position || '',
    },
    document: {
      month: templateData.period?.month || '',
      year: templateData.period?.year || new Date().getFullYear(),
    },
    company: {
      name: templateData.company?.name || '',
      regNumber: templateData.company?.regNo || '',
      address: templateData.company?.address || '',
      logoUrl: templateData.company?.logoUrl || '',
      confidentialityText: 'STRICTLY PRIVATE & CONFIDENTIAL',
    },
    payroll: {
      grossPay: parseAmount(templateData.income?.totalGross || templateData.salary?.gross || 0),
      totalDeductions: parseAmount(templateData.deduction?.total || 
        (parseAmount(templateData.deduction?.epfEmp || 0) + 
         parseAmount(templateData.deduction?.socsoEmp || 0) + 
         parseAmount(templateData.deduction?.eisEmp || 0) + 
         parseAmount(templateData.deduction?.pcb || 0) + 
         parseAmount(templateData.deduction?.other || 0))),
      netPay: parseAmount(templateData.netIncome || 
        (parseAmount(templateData.income?.totalGross || templateData.salary?.gross || 0) - 
         parseAmount(templateData.deduction?.total || 
           (parseAmount(templateData.deduction?.epfEmp || 0) + 
            parseAmount(templateData.deduction?.socsoEmp || 0) + 
            parseAmount(templateData.deduction?.eisEmp || 0) + 
            parseAmount(templateData.deduction?.pcb || 0) + 
            parseAmount(templateData.deduction?.other || 0))))),
    },
    income: {
      basicSalary: basicSalary,
      overtime: parseAmount(templateData.income?.overtime || 0),
      fixedAllowance: parseAmount(templateData.income?.fixedAllowance || 0),
      additional: additionalIncomeItems,
    },
    deductions: {
      epfEmployee: parseAmount(templateData.deduction?.epfEmp || templateData.deductions?.epfEmployee || 0),
      socsoEmployee: parseAmount(templateData.deduction?.socsoEmp || templateData.deductions?.socsoEmployee || 0),
      eisEmployee: parseAmount(templateData.deduction?.eisEmp || templateData.deductions?.eisEmployee || 0),
      pcb: parseAmount(templateData.deductions?.pcb || templateData.deduction?.pcb || templateData.deduction?.other || 0),
      additional: additionalDeductionItems,
    },
    contributions: {
      epfEmployer: parseAmount(templateData.employerContrib?.epfEr || 0),
      socsoEmployer: parseAmount(templateData.employerContrib?.socsoEr || 0),
      eisEmployer: parseAmount(templateData.employerContrib?.eisEr || 0),
      additional: (templateData.employerContrib?.additional || []).map((item: any) => ({
        label: item.label,
        amount: parseAmount(item.amount)
      })),
    },
    ytd: {
      employee: {
        epf: parseAmount(templateData.ytd?.breakdown?.epfEmployee || 0),
        socso: parseAmount(templateData.ytd?.breakdown?.socsoEmployee || 0),
        eis: parseAmount(templateData.ytd?.breakdown?.eisEmployee || 0),
        pcb: parseAmount(templateData.ytd?.breakdown?.pcb || 0),
      },
      employer: {
        epf: parseAmount(templateData.ytd?.breakdown?.epfEmployer || 0),
        socso: parseAmount(templateData.ytd?.breakdown?.socsoEmployer || 0),
        eis: parseAmount(templateData.ytd?.breakdown?.eisEmployer || 0),
      },
    },
    generated: new Date().toISOString(),
  };
}

/* ============================= Styles ================================ */
const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#fff", padding: 20, fontSize: 11 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  companyWrap: { flexDirection: "row", alignItems: "flex-start" },
  logo: { width: 42, height: 42, marginRight: 8, objectFit: "contain" },
  companyName: { fontSize: 18, fontWeight: 700 },
  regNo: { fontSize: 12, marginTop: 2 },
  address: { fontSize: 10, lineHeight: 1.3, marginTop: 2, maxWidth: 360 },
  confidential: { fontSize: 10, color: "#666" },

  employeeSection: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 6,
  },
  employeeRow: { flexDirection: "row", marginBottom: 6 },
  employeeLabel: { width: "25%", fontSize: 11, fontWeight: 700, color: "#666" },
  employeeValue: { width: "25%", fontSize: 11, fontWeight: 700 },
  monthLabel: { width: "20%", fontSize: 11, fontWeight: 700, color: "#666" },
  monthValue: { width: "30%", fontSize: 11, fontWeight: 700 },

  boxRow: { flexDirection: "row", marginBottom: 14 },
  box: { flex: 1, borderWidth: 1, borderColor: "#e9ecef", padding: 12, borderRadius: 6 },
  boxLeft: { marginRight: 6 },
  boxRight: { marginLeft: 6 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingVertical: 3 },
  itemLabel: { fontSize: 11 },
  itemAmount: { fontSize: 11, fontWeight: 700 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#dee2e6" },
  totalLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase" },
  totalAmount: { fontSize: 12, fontWeight: 700 },

  netPaySection: { backgroundColor: "#d4edda", borderWidth: 2, borderColor: "#28a745", borderRadius: 6, padding: 12, marginBottom: 14 },
  netRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  netLabel: { fontSize: 16, fontWeight: 700, textTransform: "uppercase" },
  netAmount: { fontSize: 18, fontWeight: 700 },

  contribWrap: { marginBottom: 14 },
  contribTitle: { fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 8, textTransform: "uppercase" },
  contribRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  contribRowAdditional: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  contribBox: { flex: 1, borderWidth: 1, borderColor: "#e9ecef", padding: 10, backgroundColor: "#f8f9fa", borderRadius: 6 },
  contribHead: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" },
  contribAmt: { fontSize: 12, fontWeight: 700 },

  ytdWrap: { marginBottom: 16 },
  ytdTitle: { fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 8, textTransform: "uppercase" },
  ytdRow: { flexDirection: "row", gap: 8 },
  ytdBox: { flex: 1, borderWidth: 1, borderColor: "#e9ecef", padding: 10, borderRadius: 6 },
  ytdBoxTitle: { fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" },
  ytdItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  ytdLabel: { fontSize: 10 },
  ytdAmt: { fontSize: 10, fontWeight: 700 },

  footer: { marginTop: 16, textAlign: "center", fontSize: 9, color: "#666", borderTopWidth: 1, borderTopColor: "#e9ecef", paddingTop: 10 },
});

/* =========================== Component ============================ */
export const PayslipPDFDocument: React.FC<PayslipPDFProps> = ({
  employee,
  document,
  company: companyIn,
  payroll,
  income,
  deductions,
  contributions,
  ytd,
  generated,
}) => {
  const conf = {
    company: {
      name: companyIn?.name || "UTAMA MEDGROUP SDN BHD",
      regNumber: companyIn?.regNumber || "202201033996(1479693-H)",
      address: companyIn?.address || "A2-22-3, SOHO SUITES @ KLCC, 20 JALAN PERAK, 50450 KUALA LUMPUR",
      logoUrl: companyIn?.logoUrl,
      confidentialityText: companyIn?.confidentialityText || "STRICTLY PRIVATE & CONFIDENTIAL",
    },
  };

  // FALLBACK LOGIC FOR BASIC SALARY (as per user instruction B)
  const sumAdditional = (arr?: Array<{amount: any}>) =>
    (arr || []).reduce((s, a) => s + toNum(a?.amount), 0);

  const incomeOthers =
    toNum(income?.overtime) +
    toNum(income?.fixedAllowance) +
    sumAdditional(income?.additional);

  // If basicSalary is missing/0, derive: gross - (overtime + fixed + additional)
  const basicForDisplay =
    toNum(income?.basicSalary) || Math.max(0, toNum(payroll?.grossPay) - incomeOthers);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.companyWrap}>
            {conf.company.logoUrl && (
              <Image src={conf.company.logoUrl} style={styles.logo} />
            )}
            <View>
              <Text style={styles.companyName}>{conf.company.name}</Text>
              <Text style={styles.regNo}>{conf.company.regNumber}</Text>
              <Text style={styles.address}>{conf.company.address}</Text>
            </View>
          </View>
          <Text style={styles.confidential}>{conf.company.confidentialityText}</Text>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeSection}>
          <View style={styles.employeeRow}>
            <Text style={styles.employeeLabel}>NAME:</Text>
            <Text style={styles.employeeValue}>{employee.fullName}</Text>
            <Text style={styles.monthLabel}>MONTH:</Text>
            <Text style={styles.monthValue}>{document.month}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.employeeLabel}>I/C NO.:</Text>
            <Text style={styles.employeeValue}>{employee.ic || "N/A"}</Text>
            <Text style={styles.monthLabel}>YEAR:</Text>
            <Text style={styles.monthValue}>{document.year}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.employeeLabel}>POSITION:</Text>
            <Text style={styles.employeeValue}>{employee.position || "Employee"}</Text>
          </View>
        </View>

        {/* Income vs Deductions */}
        <View style={styles.boxRow}>
          {/* Income Box */}
          <View style={[styles.box, styles.boxLeft]}>
            <Text style={styles.sectionTitle}>INCOME</Text>
            
            {/* Basic Salary - using fallback logic */}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Basic Salary</Text>
              <Text style={styles.itemAmount}>{formatRM(basicForDisplay)}</Text>
            </View>
            
            {/* Other income items */}
            {toNum(income?.overtime) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Overtime</Text>
                <Text style={styles.itemAmount}>{formatRM(income?.overtime)}</Text>
              </View>
            )}
            
            {toNum(income?.fixedAllowance) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Fixed Allowance</Text>
                <Text style={styles.itemAmount}>{formatRM(income?.fixedAllowance)}</Text>
              </View>
            )}
            
            {/* Additional income items */}
            {(income?.additional || []).map((item, idx) => 
              toNum(item.amount) > 0 && (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemAmount}>{formatRM(item.amount)}</Text>
                </View>
              )
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Gross</Text>
              <Text style={styles.totalAmount}>{formatRM(payroll.grossPay)}</Text>
            </View>
          </View>

          {/* Deductions Box */}
          <View style={[styles.box, styles.boxRight]}>
            <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
            
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>EPF</Text>
              <Text style={styles.itemAmount}>{formatRM(deductions?.epfEmployee)}</Text>
            </View>
            
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>SOCSO</Text>
              <Text style={styles.itemAmount}>{formatRM(deductions?.socsoEmployee)}</Text>
            </View>
            
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>EIS</Text>
              <Text style={styles.itemAmount}>{formatRM(deductions?.eisEmployee)}</Text>
            </View>
            
            {/* PCB/MTD */}
            {toNum(deductions?.pcb) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>MTD/PCB</Text>
                <Text style={styles.itemAmount}>{formatRM(deductions?.pcb)}</Text>
              </View>
            )}
            
            {/* Additional deduction items */}
            {(deductions?.additional || []).map((item, idx) => 
              toNum(item.amount) > 0 && (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemAmount}>{formatRM(item.amount)}</Text>
                </View>
              )
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deductions</Text>
              <Text style={styles.totalAmount}>{formatRM(payroll.totalDeductions)}</Text>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPaySection}>
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>NET PAY</Text>
            <Text style={styles.netAmount}>{formatRM(payroll.netPay)}</Text>
          </View>
        </View>

        {/* Employer Contributions */}
        <View style={styles.contribWrap}>
          <Text style={styles.contribTitle}>Current Month Employer Contribution</Text>
          <View style={styles.contribRow}>
            <View style={styles.contribBox}>
              <Text style={styles.contribHead}>EPF</Text>
              <Text style={styles.contribAmt}>{formatRM(contributions?.epfEmployer)}</Text>
            </View>
            <View style={styles.contribBox}>
              <Text style={styles.contribHead}>SOCSO</Text>
              <Text style={styles.contribAmt}>{formatRM(contributions?.socsoEmployer)}</Text>
            </View>
            <View style={styles.contribBox}>
              <Text style={styles.contribHead}>EIS</Text>
              <Text style={styles.contribAmt}>{formatRM(contributions?.eisEmployer)}</Text>
            </View>
          </View>
          
          {/* Additional Employer Contributions */}
          {contributions?.additional && contributions.additional.length > 0 && (
            <View style={styles.contribRowAdditional}>
              {contributions.additional.map((item, index) => (
                <View key={index} style={styles.contribBox}>
                  <Text style={styles.contribHead}>{item.label}</Text>
                  <Text style={styles.contribAmt}>{formatRM(item.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* YTD Summary */}
        <View style={styles.ytdWrap}>
          <Text style={styles.ytdTitle}>Year To Date (YTD) Breakdown</Text>
          <View style={styles.ytdRow}>
            <View style={styles.ytdBox}>
              <Text style={styles.ytdBoxTitle}>Employee Contribution (YTD)</Text>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>EPF</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employee?.epf)}</Text>
              </View>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>SOCSO</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employee?.socso)}</Text>
              </View>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>EIS</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employee?.eis)}</Text>
              </View>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>PCB/MTD</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employee?.pcb)}</Text>
              </View>
            </View>
            
            <View style={styles.ytdBox}>
              <Text style={styles.ytdBoxTitle}>Employer Contribution (YTD)</Text>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>EPF</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employer?.epf)}</Text>
              </View>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>SOCSO</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employer?.socso)}</Text>
              </View>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>EIS</Text>
                <Text style={styles.ytdAmt}>{formatRM(ytd?.employer?.eis)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on: {generated} | Current Month Net Pay: {formatRM(payroll.netPay)}
        </Text>
      </Page>
    </Document>
  );
};