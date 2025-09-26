# 🚀 Vercel Deployment Guide

## Why Deploy to Vercel for CORS Testing?

The CORS error you're experiencing:
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:3002' has been blocked by CORS policy
```

**This happens because:**
- 🔴 **localhost** origins are often blocked by Google Apps Script
- ✅ **Production domains** (like Vercel) typically work fine with Apps Script

## Quick Vercel Deployment

### 1. Push to GitHub (Required First)
```bash
# From your project root
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. **Sign in** with GitHub
3. **Import** your repository: `hseinsb/Estimate-Analyzer`
4. **Framework Preset**: Detected automatically (Vite)
5. **Root Directory**: `frontend`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`

### 3. Environment Variables
In Vercel dashboard, add these environment variables:

```env
VITE_FIREBASE_API_KEY=AIzaSyAna5MabetiJyzvcSraUz_ipeSvNx3HZO8
VITE_FIREBASE_AUTH_DOMAIN=estimate-analyzer-ca4c6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=estimate-analyzer-ca4c6
VITE_FIREBASE_STORAGE_BUCKET=estimate-analyzer-ca4c6.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1056245930643
VITE_FIREBASE_APP_ID=1:1056245930643:web:852b4fe9ae4ffe45774b66
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwKs39-tUr6ywo-IjFudS6tzHEH8GSTBEbOMWVxt6V_br4uW7G_k3ufXaDIS91gt6gq_A/exec
VITE_GOOGLE_SHEETS_ID=15GZo2vbLxKyp1LZjge4fI_zVpzAuf8ePZxiW5EvSTuw
```

### 4. Deploy!
Click **Deploy** and wait ~2 minutes.

## 🎯 CORS Solution Explanation

**Why this solves the CORS issue:**

| Environment | Origin | Apps Script CORS | Result |
|-------------|--------|------------------|---------|
| Local Dev | `http://localhost:3002` | ❌ Blocked | CORS Error |
| Vercel | `https://your-app.vercel.app` | ✅ Allowed | Works! |

### Technical Details:
- **Google Apps Script** is more restrictive with `localhost` origins
- **Production HTTPS domains** are typically allowed by default
- Your Apps Script already has CORS headers configured correctly
- The issue is specifically the `localhost` origin being rejected

## 🔧 Alternative Local Development Solutions

If you want to test locally without CORS issues:

### Option 1: Browser Flags (Chrome)
```bash
# Start Chrome with disabled web security (DEV ONLY!)
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security --disable-features=VizDisplayCompositor
```

### Option 2: Use Local HTTPS
```bash
# Install mkcert for local HTTPS
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Configure Vite for HTTPS (update vite.config.ts)
```

### Option 3: Deploy to Vercel (Recommended)
Just deploy to production - it's the cleanest solution!

## 🚀 Expected Results

After deploying to Vercel:
1. ✅ **PDF Upload** works perfectly
2. ✅ **Firestore Save** works (already working)
3. ✅ **Google Sheets Integration** works without CORS errors
4. ✅ **Complete end-to-end flow** operational

## 📱 Test Plan

Once deployed to Vercel:
1. Upload a CCC One PDF
2. Verify data extraction
3. Check Firestore for saved estimate
4. **Most importantly**: Check Google Sheets for new row
5. Confirm no CORS errors in browser console

---

**Bottom Line:** Yes, deploying to Vercel will solve your CORS issue! 🎉
