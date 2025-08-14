#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// IMPORTANT: This script should be run with PRODUCTION database URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('🚀 Starting production database import...');
console.log('⚠️  WARNING: This will DELETE ALL data in production database!');

// Tables in dependency order (same as export)
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

async function clearDatabase() {
  console.log('🗑️  Clearing production database...');
  
  // Disable foreign key constraints temporarily
  await pool.query('SET session_replication_role = replica;');
  
  // Clear all tables in reverse order
  for (let i = tables.length - 1; i >= 0; i--) {
    const table = tables[i];
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`   ✅ Cleared table: ${table}`);
    } catch (error) {
      console.log(`   ⚠️  Could not clear ${table}:`, error.message);
    }
  }
  
  // Re-enable foreign key constraints
  await pool.query('SET session_replication_role = DEFAULT;');
  
  console.log('✅ Database cleared successfully');
}

async function importTable(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`   ⚠️  No data to import for ${tableName}`);
    return;
  }
  
  try {
    console.log(`📥 Importing ${data.length} rows to ${tableName}`);
    
    // Get column names from first row
    const columns = Object.keys(data[0]);
    const columnNames = columns.join(', ');
    
    // Prepare values for batch insert
    const values = [];
    const params = [];
    let paramIndex = 1;
    
    for (const row of data) {
      const rowValues = [];
      for (const column of columns) {
        params.push(row[column]);
        rowValues.push(`$${paramIndex++}`);
      }
      values.push(`(${rowValues.join(', ')})`);
    }
    
    const query = `
      INSERT INTO ${tableName} (${columnNames}) 
      VALUES ${values.join(', ')}
    `;
    
    await pool.query(query, params);
    console.log(`   ✅ Successfully imported ${data.length} rows to ${tableName}`);
    
  } catch (error) {
    console.error(`   ❌ Error importing ${tableName}:`, error.message);
    // Continue with other tables
  }
}

async function main() {
  try {
    // Check if export file exists
    const exportPath = path.join(process.cwd(), 'exports', 'dev-database-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.error('❌ Export file not found!');
      console.error('   Please run export script first: node scripts/export-dev-data.js');
      process.exit(1);
    }
    
    // Load export data
    console.log('📖 Loading export data...');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    // Clear production database
    await clearDatabase();
    
    // Disable foreign key constraints during import
    await pool.query('SET session_replication_role = replica;');
    
    // Import all tables
    console.log('\n📥 Starting data import...');
    let totalImported = 0;
    
    for (const table of tables) {
      const data = exportData[table];
      if (data && data.length > 0) {
        await importTable(table, data);
        totalImported += data.length;
      }
    }
    
    // Re-enable foreign key constraints
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log('\n🎉 Import completed successfully!');
    console.log(`📈 Total rows imported: ${totalImported}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();