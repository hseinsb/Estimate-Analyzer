# Deployment Guide - Estimate Analyzer

## Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed (`npm install -g firebase-tools`)
3. **Firebase project** created
4. **Google Cloud Project** with Sheets API enabled
5. **Service Account** with Google Sheets access

## Quick Start

1. **Run setup script:**
   ```bash
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your Firebase configuration
   ```

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Initialize Firebase:**
   ```bash
   firebase login
   firebase init
   ```

5. **Deploy and start:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   firebase deploy --only functions
   npm run dev
   ```

## Detailed Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Cloud Storage**
   - **Cloud Functions**

4. Get your project configuration:
   - Go to Project Settings > General
   - Copy the Firebase config object

### 2. Google Sheets Setup

1. **Create a Google Sheet** with these columns (A-V):
   ```
   A: Date          B: Job #         C: Customer       D: Claim #
   E: Insurance     F: Year          G: Make           H: Model
   I: VIN           J: Parts (Est)   K: Labor (Total)  L: Paint Supplies
   M: Misc          N: Other         O: Subtotal       P: Sales Tax
   Q: Insurance Pay R: Estimate Profit S: Actual Parts Cost T: Actual Profit
   U: PDF Link      V: Status
   ```

2. **Add formulas to row 2:**
   - R2: `=Q2 - (J2 + L2 + M2 + N2)`
   - T2: `=IF(S2="", "", Q2 - (S2 + L2 + M2 + N2))`

3. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google Sheets API
   - Create Service Account with Editor role
   - Download JSON key file
   - Share your Google Sheet with the service account email (as Editor)

### 3. Environment Configuration

Update `.env` file with your configuration:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Google Sheets Integration
GOOGLE_SHEETS_ID=your-google-sheets-id
SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 4. Firebase Configuration

Update `frontend/src/lib/firebase.ts` with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 5. Cloud Functions Configuration

Set environment variables for Cloud Functions:

```bash
firebase functions:config:set \
  sheets.sheet_id="your-google-sheets-id" \
  service_account="$(cat path/to/service-account-key.json)"
```

### 6. Authentication Setup

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Add authorized users in the Users tab

### 7. Deployment Steps

1. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

2. **Build and deploy Cloud Functions:**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

3. **Build and deploy frontend:**
   ```bash
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```

4. **Deploy everything:**
   ```bash
   firebase deploy
   ```

## Development

### Local Development

```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on localhost:3000
npm run dev:functions # Functions emulator on localhost:5001
```

### Firebase Emulators

To use Firebase emulators for local development:

1. Update `frontend/src/lib/firebase.ts`:
   ```typescript
   if (import.meta.env.DEV) {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
     connectStorageEmulator(storage, 'localhost', 9199);
     connectFunctionsEmulator(functions, 'localhost', 5001);
   }
   ```

2. Start emulators:
   ```bash
   firebase emulators:start
   ```

## Testing

### Setup Validation

Run the setup test script:
```bash
node test-setup.js
```

### Manual Testing

1. **Upload a PDF:**
   - Go to `/upload`
   - Upload a CCC One estimate PDF
   - Verify processing completes

2. **Check Google Sheets:**
   - Verify new row was added
   - Check that formulas calculated correctly

3. **Review estimates:**
   - Go to `/estimates`
   - Verify data displays correctly
   - Test filtering and search

### Acceptance Criteria

✅ All 15 requirements from the original specification:

1. **PDF Upload** - Drag & drop interface ✅
2. **Text Extraction** - PDF parsing with fallback ✅
3. **Field Parsing** - All required fields extracted ✅
4. **Firebase Storage** - Organized by date ✅
5. **Firestore Database** - Complete schema ✅
6. **Google Sheets** - Automatic row appending ✅
7. **Profit Calculations** - Server-side and formulas ✅
8. **Authentication** - Workspace users only ✅
9. **Real-time UI** - Live status updates ✅
10. **Error Handling** - Comprehensive retry logic ✅
11. **Confidence Scoring** - Validation and review ✅
12. **Security** - No client secrets ✅
13. **Edge Cases** - Missing fields handled ✅
14. **Admin Features** - Health checks ✅
15. **Modern UI** - React + Tailwind CSS ✅

## Troubleshooting

### Common Issues

1. **"Permission denied" errors:**
   - Check Firestore security rules
   - Verify user authentication

2. **Google Sheets errors:**
   - Verify service account permissions
   - Check sheet ID in configuration

3. **PDF parsing failures:**
   - Ensure PDF has text layer
   - Check Cloud Functions logs

4. **Upload failures:**
   - Check Firebase Storage rules
   - Verify file size limits

### Monitoring

- **Cloud Functions logs:** `firebase functions:log`
- **Firebase Console:** Real-time monitoring
- **Health endpoint:** `/healthCheck`

### Support

1. Check Firebase Console for errors
2. Review browser console logs
3. Test with Firebase emulators
4. Verify Google Sheets permissions

## Performance Optimization

### Production Settings

1. **Enable compression** in hosting
2. **Set up CDN** for static assets
3. **Configure caching** for Cloud Functions
4. **Monitor quotas** and billing

### Scaling Considerations

- Cloud Functions automatically scale
- Firestore handles concurrent reads/writes
- Consider batch processing for high volumes
- Monitor Google Sheets API quotas

## Security

### Best Practices

1. **Never commit** service account keys
2. **Use environment variables** for secrets
3. **Enable audit logging** in Firebase
4. **Regularly rotate** service account keys
5. **Monitor access logs** for anomalies

### Compliance

- All data encrypted in transit and at rest
- Access logs maintained
- User authentication required
- No client-side secrets

## Backup & Recovery

### Data Backup

1. **Firestore:** Automatic backups enabled
2. **Storage:** Cross-region replication
3. **Google Sheets:** Version history available

### Disaster Recovery

1. **Multi-region deployment** available
2. **Database export/import** procedures
3. **Configuration backup** in version control
