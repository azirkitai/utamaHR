# Panduan Deployment ke Vercel

## Langkah-langkah untuk deploy aplikasi UtamaHR ke Vercel:

### 1. Setup GitHub Repository
- Push semua kod ke GitHub repository anda
- Pastikan `.gitignore` sudah betul (jangan commit `.env` file)

### 2. Setup Environment Variables di Vercel
Masuk ke Vercel Dashboard → Project Settings → Environment Variables, tambah:

```
DATABASE_URL=your_postgresql_connection_string_here
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_session_secret_minimum_32_characters_long
NODE_ENV=production
```

### 3. Database Setup
- Gunakan Neon PostgreSQL atau database PostgreSQL lain yang compatible
- Database URL format: `postgresql://username:password@host:port/database`
- Jalankan migration: `npm run db:push` (atau setup dari Drizzle Studio)

### 4. Deploy ke Vercel
- Connect GitHub repository dengan Vercel
- Vercel akan auto-detect dan build menggunakan konfigurasi dalam `vercel.json`
- Build command: `npm run build`
- Output directory: `dist`

### 5. Troubleshooting
Jika ada error "Invalid JSON", check:
- Environment variables sudah betul
- Database connection working
- API routes accessible

## File Configuration yang Telah Disiapkan:
- ✅ `vercel.json` - Vercel deployment config
- ✅ `api/index.ts` - Serverless function entry point
- ✅ `.env.example` - Template environment variables
- ✅ Build scripts updated

Sekarang aplikasi anda sudah ready untuk di-deploy ke Vercel!