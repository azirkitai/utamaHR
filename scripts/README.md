# Database Migration Scripts

Scripts untuk copy data dari development ke production database.

## 🚀 Cara Penggunaan

### 1. Export Data dari Development

```bash
# Pastikan anda ada di development environment
node scripts/export-dev-data.js
```

Script ini akan:
- Export semua data dari development database
- Simpan ke file `exports/dev-database-export.json`
- Show summary berapa rows di export

### 2. Import Data ke Production

```bash
# Pastikan anda ada di production environment
# DAN DATABASE_URL sudah set ke production database
node scripts/import-to-production.js
```

Script ini akan:
- PADAM semua data di production database
- Import semua data dari export file
- Maintain foreign key relationships

## ⚠️ PENTING!

1. **Backup**: Pastikan ada backup production database sebelum run import script
2. **Environment**: Pastikan DATABASE_URL pointing ke correct database:
   - Development untuk export
   - Production untuk import
3. **Order**: Mesti run export dulu, then import
4. **Data Loss**: Import script akan PADAM semua existing data di production

## 📁 Files

- `export-dev-data.js` - Export development data
- `import-to-production.js` - Import ke production 
- `dev-database-export.json` - Export file (auto-generated)

## 🔍 Troubleshooting

Jika ada error:
1. Check DATABASE_URL environment variable
2. Pastikan database connection working
3. Check foreign key constraints
4. Verify table structure sama di both databases