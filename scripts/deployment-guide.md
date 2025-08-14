# Production Database Migration Guide

## 🚨 PENTING - Langkah Migration

### Step 1: Backup Production Database (Important!)
Sebelum run migration, pastikan ada backup production database untuk safety.

### Step 2: Run Migration Script di Production
1. Masuk ke production environment
2. Pastikan DATABASE_URL pointing ke production database
3. Run script migration:

```bash
# Method 1: Via Database Tool (Rekomendasi)
# Copy semua content dari scripts/production-migration.sql
# Paste dan run di Database pane production environment

# Method 2: Via Command Line (jika ada access)
psql $DATABASE_URL -f scripts/production-migration.sql
```

### Step 3: Verify Migration
Selepas migration, check data:

```sql
-- Check users
SELECT id, username, role FROM users;

-- Check employees  
SELECT id, full_name, role, status FROM employees;

-- Check employment
SELECT e.full_name, emp.company, emp.designation 
FROM employees e 
JOIN employment emp ON e.id = emp.employee_id;

-- Check contact
SELECT e.full_name, c.email, c.phone_number
FROM employees e 
JOIN contact c ON e.id = c.employee_id;
```

## 📊 Data Yang Akan Di-migrate

### Users (6 records):
- Azirkitai (Admin) 
- testemployee (Admin)
- Syed2607 (Staff/Employee)
- maryam1234 (Admin)
- kamal1234 (Staff/Employee)
- siti nadiah (Finance/Account)

### Employees (6 records):
- kamal ludin (Staff/Employee)
- SYED MUHYAZIR HASSIM (Staff/Employee) 
- maryam maisarah (Admin)
- AZIRKITAI (Admin)
- TEST EMPLOYEE (Admin)
- SITI NADIAH SABRI (Staff/Employee)

### Employment & Contact Records:
- Semua employment dan contact details untuk setiap employee

## ✅ Expected Result

Selepas migration:
1. Production database akan ada semua users dan employees dari development
2. Employee creation akan berfungsi kerana user roles sudah betul
3. Authorization issues akan resolved
4. Semua data relationships akan intact

## 🔧 Troubleshooting

Jika ada error:
1. Check foreign key constraints - script disable temporarily 
2. Check data types compatibility
3. Verify table structure sama di production dan development
4. Check DATABASE_URL pointing ke correct database

## 🔄 Rollback Plan

Jika migration gagal:
1. Restore dari backup yang dibuat di Step 1
2. Or truncate semua tables dan restore manually

## 📞 Support

Jika ada issues, check:
- Server logs untuk detailed error messages
- Database connection status
- Table permissions dan constraints