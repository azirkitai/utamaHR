import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font 
} from '@react-pdf/renderer';

// Define styles for PDF matching the exact template format
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 11,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  leftHeader: {
    flexDirection: 'column',
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  regNumber: {
    fontSize: 12,
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  rightHeader: {
    textAlign: 'right',
    fontSize: 10,
    color: '#666',
  },
  employeeSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  employeeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  employeeLabel: {
    width: '25%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  employeeValue: {
    width: '25%',
    fontSize: 11,
    fontWeight: 'bold',
  },
  monthLabel: {
    width: '20%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  monthValue: {
    width: '30%',
    fontSize: 11,
    fontWeight: 'bold',
  },
  payrollSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  incomeBox: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
  },
  deductionBox: {
    flex: 1,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 3,
  },
  itemLabel: {
    fontSize: 11,
  },
  itemAmount: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  netPaySection: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 5,
    padding: 15,
    marginBottom: 20,
  },
  netPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  netPayAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contributionSection: {
    marginBottom: 20,
  },
  contributionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  contributionRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  contributionBox: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  contributionBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  contributionAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ytdSection: {
    marginBottom: 20,
  },
  ytdTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  ytdRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  ytdBox: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
  },
  ytdBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  ytdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ytdItemLabel: {
    fontSize: 10,
  },
  ytdItemAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666666',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 15,
  },
});

// Payslip PDF Document Component
interface PayslipPDFProps {
  employee: {
    fullName: string;
    employeeNo: string;
    ic: string;
    id: string;
    position?: string;
  };
  document: {
    month: string;
    year: number;
    id: string;
  };
  payroll: {
    grossPay: number;
    totalDeductions: number;
    netPay: number;
  };
  company?: {
    name?: string;
    regNumber?: string;
    address?: string;
  };
  income?: {
    basicSalary?: number;
    overtime?: number;
    fixedAllowance?: number;
    additional?: Array<{label: string; amount: number}>;
  };
  deductions?: {
    epfEmployee?: number;
    socsoEmployee?: number;
    eisEmployee?: number;
    pcb?: number;
    additional?: Array<{label: string; amount: number}>;
  };
  contributions?: {
    epfEmployer?: number;
    socsoEmployer?: number;
    eisEmployer?: number;
  };
  ytd?: {
    employee?: {
      epf?: number;
      socso?: number;
      eis?: number;
      pcb?: number;
    };
    employer?: {
      epf?: number;
      socso?: number;
      eis?: number;
    };
  };
  generated: string;
}

export const PayslipPDFDocument: React.FC<PayslipPDFProps> = ({
  employee,
  document,
  payroll,
  company,
  income,
  deductions,
  contributions,
  ytd,
  generated,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.leftHeader}>
          <Text style={styles.companyName}>
            {company?.name || 'UTAMA MEDGROUP'}
          </Text>
          <Text style={styles.regNumber}>
            {company?.regNumber || '202201033996(1479693-H)'}
          </Text>
          <Text style={styles.address}>
            {company?.address || 'Lot 5138S-A, Lorong 1g Mohd Amin, Jln Wan Hassan, Kg Batu 4, 43650,\nBandar Baru Bangi, Selangor'}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          <Text>STRICTLY PRIVATE & CONFIDENTIAL</Text>
        </View>
      </View>

      {/* Employee Information Section */}
      <View style={styles.employeeSection}>
        <View style={styles.employeeRow}>
          <Text style={styles.employeeLabel}>NAME:</Text>
          <Text style={styles.employeeValue}>{employee.fullName}</Text>
          <Text style={styles.monthLabel}>MONTH:</Text>
          <Text style={styles.monthValue}>{document.month.toUpperCase()}</Text>
        </View>
        <View style={styles.employeeRow}>
          <Text style={styles.employeeLabel}>I/C NO.:</Text>
          <Text style={styles.employeeValue}>{employee.ic || 'N/A'}</Text>
          <Text style={styles.monthLabel}>YEAR:</Text>
          <Text style={styles.monthValue}>{document.year}</Text>
        </View>
        <View style={styles.employeeRow}>
          <Text style={styles.employeeLabel}>POSITION:</Text>
          <Text style={styles.employeeValue}>{employee.position || 'SENIOR MANAGER'}</Text>
        </View>
      </View>

      {/* Income and Deduction Sections */}
      <View style={styles.payrollSection}>
        {/* Income Box */}
        <View style={styles.incomeBox}>
          <Text style={styles.sectionTitle}>INCOME</Text>
          
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Basic Salary</Text>
            <Text style={styles.itemAmount}>RM {(income?.basicSalary || 0).toFixed(2)}</Text>
          </View>
          
          {income?.overtime && income.overtime > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Overtime</Text>
              <Text style={styles.itemAmount}>RM {income.overtime.toFixed(2)}</Text>
            </View>
          )}
          
          {income?.fixedAllowance && income.fixedAllowance > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>FIXED ALLOWENCE</Text>
              <Text style={styles.itemAmount}>RM {income.fixedAllowance.toFixed(2)}</Text>
            </View>
          )}

          {income?.additional?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemAmount}>RM {item.amount.toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL GROSS</Text>
            <Text style={styles.totalAmount}>RM {payroll.grossPay.toFixed(2)}</Text>
          </View>
        </View>

        {/* Deduction Box */}
        <View style={styles.deductionBox}>
          <Text style={styles.sectionTitle}>DEDUCTION</Text>
          
          {deductions?.epfEmployee && deductions.epfEmployee > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>EPF Employee</Text>
              <Text style={styles.itemAmount}>RM {deductions.epfEmployee.toFixed(2)}</Text>
            </View>
          )}
          
          {deductions?.socsoEmployee && deductions.socsoEmployee > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>SOCSO Employee</Text>
              <Text style={styles.itemAmount}>RM {deductions.socsoEmployee.toFixed(2)}</Text>
            </View>
          )}
          
          {deductions?.eisEmployee && deductions.eisEmployee > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>EIS Employee</Text>
              <Text style={styles.itemAmount}>RM {deductions.eisEmployee.toFixed(2)}</Text>
            </View>
          )}
          
          {deductions?.pcb && deductions.pcb > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>MTD/PCB</Text>
              <Text style={styles.itemAmount}>RM {deductions.pcb.toFixed(2)}</Text>
            </View>
          )}

          {deductions?.additional?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemAmount}>RM {item.amount.toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL DEDUCTION</Text>
            <Text style={styles.totalAmount}>RM {payroll.totalDeductions.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Net Pay Section */}
      <View style={styles.netPaySection}>
        <View style={styles.netPayRow}>
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayAmount}>RM {payroll.netPay.toFixed(2)}</Text>
        </View>
      </View>

      {/* Employer Contribution Section */}
      <View style={styles.contributionSection}>
        <Text style={styles.contributionTitle}>EMPLOYER CONTRIBUTION</Text>
        <View style={styles.contributionRow}>
          <View style={styles.contributionBox}>
            <Text style={styles.contributionBoxTitle}>EPF EMPLOYER</Text>
            <Text style={styles.contributionAmount}>RM {(contributions?.epfEmployer || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.contributionBox}>
            <Text style={styles.contributionBoxTitle}>SOCSO EMPLOYER</Text>
            <Text style={styles.contributionAmount}>RM {(contributions?.socsoEmployer || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.contributionBox}>
            <Text style={styles.contributionBoxTitle}>EIS EMPLOYER</Text>
            <Text style={styles.contributionAmount}>RM {(contributions?.eisEmployer || 0).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Year to Date Summary */}
      <View style={styles.ytdSection}>
        <Text style={styles.ytdTitle}>YEAR TO DATE SUMMARY</Text>
        <View style={styles.ytdRow}>
          <View style={styles.ytdBox}>
            <Text style={styles.ytdBoxTitle}>EMPLOYEE CONTRIBUTION YTD</Text>
            {ytd?.employee?.epf && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>EPF Employee</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employee.epf.toFixed(2)}</Text>
              </View>
            )}
            {ytd?.employee?.socso && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>SOCSO Employee</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employee.socso.toFixed(2)}</Text>
              </View>
            )}
            {ytd?.employee?.eis && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>EIS Employee</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employee.eis.toFixed(2)}</Text>
              </View>
            )}
            {ytd?.employee?.pcb && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>PCB/MTD</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employee.pcb.toFixed(2)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.ytdBox}>
            <Text style={styles.ytdBoxTitle}>EMPLOYER CONTRIBUTION YTD</Text>
            {ytd?.employer?.epf && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>EPF Employer</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employer.epf.toFixed(2)}</Text>
              </View>
            )}
            {ytd?.employer?.socso && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>SOCSO Employer</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employer.socso.toFixed(2)}</Text>
              </View>
            )}
            {ytd?.employer?.eis && (
              <View style={styles.ytdItem}>
                <Text style={styles.ytdItemLabel}>EIS Employer</Text>
                <Text style={styles.ytdItemAmount}>RM {ytd.employer.eis.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Dokumen ini dijana secara automatik dan tidak memerlukan tandatangan.</Text>
        <Text>Generated on: {generated}</Text>
      </View>
    </Page>
  </Document>
);