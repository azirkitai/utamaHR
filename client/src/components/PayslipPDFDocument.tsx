import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font 
} from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
    fontSize: 12,
  },
  separator: {
    marginVertical: 15,
    height: 1,
    backgroundColor: '#cccccc',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    padding: 6,
    fontSize: 10,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

// Payslip PDF Document Component
interface PayslipPDFProps {
  employee: {
    fullName: string;
    employeeNo: string;
    ic: string;
    id: string;
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
    address?: string;
  };
  generated: string;
}

export const PayslipPDFDocument: React.FC<PayslipPDFProps> = ({
  employee,
  document,
  payroll,
  company,
  generated,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {company?.name || 'UTAMA MEDGROUP'}
        </Text>
        <Text style={styles.subtitle}>SLIP GAJI</Text>
        <Text style={{ fontSize: 12 }}>
          {document.month}/{document.year}
        </Text>
      </View>

      {/* Company Address */}
      {company?.address && (
        <View style={{ textAlign: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 10 }}>{company.address}</Text>
        </View>
      )}

      {/* Employee Information */}
      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
          MAKLUMAT PEKERJA
        </Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Nama Pekerja:</Text>
          <Text style={styles.value}>{employee.fullName}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>No. Pekerja:</Text>
          <Text style={styles.value}>{employee.employeeNo}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>No. IC:</Text>
          <Text style={styles.value}>{employee.ic}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Bulan/Tahun:</Text>
          <Text style={styles.value}>{document.month}/{document.year}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Salary Information */}
      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
          BUTIRAN GAJI
        </Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Jumlah Gaji Kasar:</Text>
          <Text style={styles.value}>RM {payroll.grossPay.toFixed(2)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Jumlah Potongan:</Text>
          <Text style={styles.value}>RM {payroll.totalDeductions.toFixed(2)}</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.row}>
          <Text style={[styles.label, { fontWeight: 'bold', fontSize: 14 }]}>
            GAJI BERSIH:
          </Text>
          <Text style={[styles.value, { fontWeight: 'bold', fontSize: 14 }]}>
            RM {payroll.netPay.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Dihasilkan pada: {generated}</Text>
        <Text>Document ID: {document.id}</Text>
        <Text>--- Dokumen ini adalah janaan komputer ---</Text>
      </View>
    </Page>
  </Document>
);