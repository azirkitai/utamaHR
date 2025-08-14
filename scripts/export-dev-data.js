#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('🚀 Starting development database export...');

// List of all tables to export (in dependency order)
const tables = [
  'users',
  'employees', 
  'employment',
  'contact',
  'family_details',
  'work_experiences',
  'employee_documents',
  'office_locations',
  'qr_tokens',
  'clock_in_records',
  'attendance_records',
  'company_settings',
  'app_setting',
  'announcements',
  'announcement_reads',
  'user_announcements',
  'approval_settings',
  'group_policy_settings',
  'company_leave_types',
  'leave_policy',
  'leave_policy_settings',
  'leave_balance_carry_forward',
  'leave_applications',
  'financial_claim_policies',
  'claim_policy',
  'claim_applications',
  'overtime_approval_settings',
  'overtime_policies', 
  'overtime_settings',
  'employee_salaries',
  'salary_basic_earnings',
  'salary_additional_items',
  'salary_deduction_items',
  'salary_company_contributions',
  'compensation',
  'payroll_documents',
  'payroll_items',
  'payment_vouchers',
  'disciplinary',
  'documents',
  'equipment',
  'company_access'
];

async function exportTable(tableName) {
  try {
    console.log(`📦 Exporting table: ${tableName}`);
    
    // Get all data from table
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    if (result.rows.length === 0) {
      console.log(`   ⚠️  Table ${tableName} is empty`);
      return [];
    }
    
    console.log(`   ✅ Exported ${result.rows.length} rows from ${tableName}`);
    return result.rows;
    
  } catch (error) {
    console.error(`   ❌ Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function main() {
  try {
    const exportData = {};
    
    for (const table of tables) {
      exportData[table] = await exportTable(table);
    }
    
    // Save to file
    const exportPath = path.join(process.cwd(), 'exports', 'dev-database-export.json');
    
    // Create exports directory if it doesn't exist
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports');
    }
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('\n🎉 Export completed successfully!');
    console.log(`📁 Export saved to: ${exportPath}`);
    
    // Show summary
    let totalRows = 0;
    console.log('\n📊 Export Summary:');
    for (const [table, data] of Object.entries(exportData)) {
      const count = data.length;
      totalRows += count;
      if (count > 0) {
        console.log(`   ${table}: ${count} rows`);
      }
    }
    console.log(`\n📈 Total rows exported: ${totalRows}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();