# Panduan Deployment ke Vercel

## Langkah-langkah untuk deploy aplikasi UtamaHR ke Vercel:

### 1. Setup GitHub Repository
- Push semua kod ke GitHub repository anda
- Pastikan `.gitignore` sudah betul (jangan commit `.env` file)

### 2. Setup Environment Variables di Vercel
Masuk ke Vercel Dashboard → Project Settings → Environment Variables, tambah:

```
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
NODE_ENV=production
```

**Important**: Untuk demo, authentication menggunakan hardcoded user:
- Username: `syedmuhyazir` 
- Password: `apa-apa password pun boleh` (untuk testing sahaja)

### 3. Deploy ke Vercel
- Connect GitHub repository dengan Vercel
- Vercel akan auto-detect dan build menggunakan konfigurasi dalam `vercel.json`
- Build command: `npm run build`
- Output directory: `dist`

### 4. API Endpoints yang Available:
- `POST /api/login` - Login authentication
- `GET /api/user` - Get current user info (requires Bearer token)

### 5. Troubleshooting
Jika ada error "Invalid JSON":
- Check environment variables sudah betul
- Pastikan JWT_SECRET ada di Vercel environment variables
- Login dengan username: `syedmuhyazir` dan sebarang password

## File Configuration yang Telah Disiapkan:
- ✅ `vercel.json` - Vercel deployment config dengan proper routing
- ✅ `api/auth.ts` - Authentication serverless function 
- ✅ `api/index.ts` - General API serverless function
- ✅ `.env.example` - Template environment variables
- ✅ Build scripts updated

**Status**: ✅ Aplikasi ready untuk deploy ke Vercel dengan working authentication!