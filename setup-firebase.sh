#!/bin/bash

echo "🔥 Setting up Estimate Analyzer for Firebase project: estimate-analyzer-ca4c6"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please log in to Firebase:"
    firebase login
fi

# Set the project
echo "🎯 Setting Firebase project..."
firebase use estimate-analyzer-ca4c6

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyAna5MabetiJyzvcSraUz_ipeSvNx3HZO8
FIREBASE_AUTH_DOMAIN=estimate-analyzer-ca4c6.firebaseapp.com
FIREBASE_PROJECT_ID=estimate-analyzer-ca4c6
FIREBASE_STORAGE_BUCKET=estimate-analyzer-ca4c6.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1056245930643
FIREBASE_APP_ID=1:1056245930643:web:852b4fe9ae4ffe45774b66
FIREBASE_MEASUREMENT_ID=G-JW75K1VH7Q

# Google Sheets Integration (configure these)
GOOGLE_SHEETS_ID=your-google-sheets-id
SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Google Sheets integration in .env file"
echo "2. Deploy security rules: firebase deploy --only firestore:rules,storage:rules"
echo "3. Deploy Cloud Functions: firebase deploy --only functions"
echo "4. Start development: npm run dev"
echo ""
echo "📚 See README.md for detailed instructions"
