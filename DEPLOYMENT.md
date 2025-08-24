# UtamaHR - Vercel Deployment Instructions

## Project Structure
This is a frontend-only build project where:
- `index.html` is at the root
- React source code is in `client/src/`
- Build output goes to `dist/`

## ✅ Ready for Deployment

### 1. Push to GitHub
Your project needs to be pushed to GitHub. Since Git operations are restricted in Replit, you'll need to:

```bash
# In your local terminal or GitHub desktop
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### 2. Vercel Import Settings
When importing to Vercel, use these **exact** settings:

**Build & Output Settings:**
- ✅ **Build Command:** `npm run build`
- ✅ **Output Directory:** `dist`
- ✅ **Install Command:** `npm ci`
- ✅ **Root Directory:** Leave blank (or `.`)

### 3. Environment Variables Needed
Set these in Vercel dashboard:

**Required for Backend Integration:**
- `DATABASE_URL` - Your Neon/PostgreSQL connection string
- `JWT_SECRET` - For authentication tokens
- `SESSION_SECRET` - For session management

**Optional for Full Features:**
- Any other API keys your app uses

### 4. Build Verification
✅ **Local build test passed:**
- Build size: ~1.3MB (compressed)
- Output: `dist/index.html` + `dist/assets/`
- No critical errors

### 5. Expected Results
After successful deployment:
- ✅ Static files served from `dist/`
- ✅ SPA routing handled by index.html
- ✅ Assets loaded from `/assets/` directory
- ✅ All React components and pages working

## Troubleshooting

### "No Output Directory named 'dist'" Error
- Verify build command is exactly: `npm run build`
- Check that output directory is exactly: `dist`
- Ensure `vite.config.mjs` is present in root

### Build Failures
- Check that Node.js version is 18+ in Vercel
- Verify all dependencies are in package.json
- Check that build succeeds locally first

### Route 404 Errors
- Ensure `vercel.json` includes SPA rewrites
- Check that `rewrites` configuration is present

## Current Configuration Files
- ✅ `vite.config.mjs` - Optimized for production
- ✅ `vercel.json` - SPA routing + build config
- ✅ `.gitignore` - Excludes unnecessary files
- ✅ `package.json` - All dependencies listed

## Support
If deployment fails, check:
1. Vercel build logs for specific errors
2. Verify environment variables are set
3. Test build locally with `npm run build`