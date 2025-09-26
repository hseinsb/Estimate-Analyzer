# Estimate Analyzer (Firebase Spark Plan)

A comprehensive system for processing CCC One estimate PDFs with browser-based data extraction, Firestore database, and Google Sheets integration. **100% free** on Firebase Spark plan.

## 🎯 Features

- **🖥️ Browser-based PDF Processing**: Client-side extraction using PDF.js (no server costs)
- **🔥 Firebase Firestore**: Real-time database for structured data (free tier)
- **📊 Google Sheets Integration**: Automatic row appending via Google Apps Script
- **⚡ Instant Results**: PDFs processed in 5-10 seconds directly in browser
- **🔐 Firebase Authentication**: Secure workspace-only access
- **💰 Zero Cost**: Designed for Firebase Spark (free) plan
- **📱 Modern UI**: React frontend with Tailwind CSS

## 🏗️ Architecture (Spark Plan Optimized)

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + PDF.js
- **Database**: Firebase Firestore (free tier)
- **Authentication**: Firebase Authentication (free tier)
- **Sheets Integration**: Google Apps Script Web App
- **PDF Processing**: Client-side with `pdfjs-dist` library

### Data Flow (Frontend-Only)
```
1. User uploads PDF → 
2. Browser parses PDF with PDF.js → 
3. Extracts structured data → 
4. Saves to Firestore → 
5. Appends to Google Sheets → 
6. Shows results instantly
```

**✅ No server-side processing or storage costs!**

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Firebase account (free)
- Google account (for Sheets integration)

### 2. Installation
```bash
# Clone repository
git clone https://github.com/hseinsb/Estimate-Analyzer.git
cd Estimate-Analyzer
cd frontend
npm install
```

### 📤 GitHub Push Instructions
The repository is ready with all code committed. To push manually:

```bash
# From the project root directory (Estimate-Analyzer/)
git push -u origin main
```
You'll be prompted for GitHub authentication.

### 3. Firebase Setup
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Copy your Firebase config to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Google Sheets Setup
1. Create a Google Sheet with columns A-V (see detailed setup below)
2. Follow the [Google Apps Script Setup Guide](./GOOGLE_APPS_SCRIPT_SETUP.md)
3. Add Apps Script URL to `frontend/.env`:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
VITE_GOOGLE_SHEETS_ID=your-sheet-id
```

### 5. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

## 📊 Google Sheets Configuration

### Required Columns (A-V)
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Date | Job # | Customer | Claim # | Insurance | Year | Make | Model | VIN | Parts (Est) | Labor | Paint Supplies | Misc | Other | Subtotal | Sales Tax | Insurance Pay | Estimate Profit | Actual Parts Cost | Actual Profit | PDF Link | Status |

### Formulas (Row 2)
- **R2**: `=Q2 - (J2 + L2 + M2 + N2)` (Estimate Profit)
- **T2**: `=IF(S2="", "", Q2 - (S2 + L2 + M2 + N2))` (Actual Profit)

Copy these formulas down as needed.

## 🔧 Detailed Setup

### Firebase Authentication Setup
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**
3. Add your workspace users manually or enable registration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /estimates/{estimateId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Google Apps Script Integration
See [GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md) for complete setup instructions.

## 📱 Usage

### Uploading Estimates
1. **Sign in** with your Firebase account
2. **Navigate** to Upload page
3. **Optionally enter** Job Number and Notes
4. **Drag & drop** PDF or click to browse
5. **Wait 5-10 seconds** for processing
6. **View results** in All Estimates list

### Reviewing Data
- **✅ Parsed**: Successfully processed, data in Google Sheets
- **⚠️ Needs Review**: Low confidence or missing fields
- **❌ Error**: Processing failed, manual intervention needed

### Google Sheets Integration
- New rows automatically appended
- Estimate Profit calculated automatically
- Manual entry of Actual Parts Cost enables Actual Profit calculation
- PDF filename stored for reference (no file storage)

## 🔍 PDF Parsing Logic

The system extracts these fields from CCC One estimates:

### Basic Information
- **Customer Name** (Owner/Insured)
- **Claim Number**
- **Insurance Company**
- **Job Number** (RO/Workfile ID)
- **Vehicle** (Year, Make, Model, VIN)

### Financial Totals
- **Parts**, **Labor** (aggregated), **Paint Supplies**
- **Miscellaneous**, **Other Charges**
- **Subtotal**, **Sales Tax**, **Insurance Pay**

### Confidence Scoring
- Based on successful field extraction
- Estimates below 85% confidence marked for review
- Missing required fields trigger review status

## 🚀 Deployment

### Build and Deploy
```bash
# Build frontend
npm run build

# Deploy to Firebase Hosting
npm run deploy:hosting

# Deploy Firestore rules
npm run deploy:firestore
```

### Environment Variables
Create `frontend/.env` with:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
VITE_GOOGLE_SHEETS_ID=your-sheet-id
```

## 🛠️ Troubleshooting

### Common Issues

1. **PDF parsing fails**
   - Ensure PDF has text layer (not just images)
   - Try with a different CCC One estimate format

2. **Google Sheets errors**
   - Verify Apps Script is deployed as Web App
   - Check sheet permissions and column structure
   - Ensure formulas are in correct columns (R and T)

3. **Authentication issues**
   - Verify Firebase Auth is enabled
   - Check user permissions in Firebase Console

4. **Build errors**
   - Run `npm run install:all` to install all dependencies
   - Check Node.js version (18+ required)

### Debugging
- **Browser Console**: Check for JavaScript errors
- **Firebase Console**: Monitor Firestore writes and Auth events
- **Apps Script Logs**: Check execution logs in Google Apps Script editor

## 📁 Project Structure

```
estimate-analyzer/
├── firebase.json              # Firebase configuration
├── firestore.rules           # Database security rules
├── firestore.indexes.json    # Database indexes
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── UploadForm.tsx
│   │   │   ├── EstimatesList.tsx
│   │   │   └── EstimateDetail.tsx
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utilities and config
│   │       ├── firebase.ts  # Firebase config
│   │       ├── pdfParser.ts # PDF parsing logic
│   │       └── googleSheets.ts # Sheets integration
│   └── package.json         # Frontend dependencies
├── GOOGLE_APPS_SCRIPT_SETUP.md # Sheets integration guide
└── README.md                # This file
```

## 💰 Cost Breakdown

| Service | Free Tier Limit | Monthly Cost |
|---------|----------------|--------------|
| Firebase Firestore | 50K reads, 20K writes | $0 |
| Firebase Auth | Unlimited users | $0 |
| Firebase Hosting | 10GB storage, 360MB/day | $0 |
| Google Apps Script | Unlimited executions | $0 |
| Google Sheets | Unlimited sheets | $0 |
| **Total** | | **$0** |

## 🔒 Security

- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore security rules restrict access
- **Sheets Integration**: Apps Script runs under your Google account
- **No Sensitive Data**: Service account keys not exposed in frontend

## 📈 Performance

- **PDF Processing**: 5-10 seconds in browser
- **Database Writes**: < 1 second
- **Sheets Integration**: 2-3 seconds
- **Total Processing Time**: ~10-15 seconds per PDF

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.

---

**🎉 Ready to process CCC One estimates for free!** Upload your first PDF and see the magic happen in your browser.