#!/bin/bash

# Estimate Analyzer Setup Script
echo "🚀 Setting up Estimate Analyzer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your Firebase and Google Sheets configuration"
fi

# Initialize Firebase (if not already done)
if [ ! -f .firebaserc ]; then
    echo "🔥 Initializing Firebase project..."
    echo "Please run 'firebase login' first if you haven't already"
    firebase init --interactive
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up Google Sheets with the required columns (see README.md)"
echo "3. Deploy Firestore rules: firebase deploy --only firestore:rules,storage:rules"
echo "4. Deploy Cloud Functions: firebase deploy --only functions"
echo "5. Start development: npm run dev"
echo ""
echo "📚 See README.md for detailed setup instructions"
