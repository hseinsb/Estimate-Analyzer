#!/bin/bash

echo "🔧 Firebase Firestore Rules Deployment Script"
echo "=============================================="
echo ""

echo "Step 1: Login to Firebase"
echo "Run this command in your terminal:"
echo "npx firebase login"
echo ""

echo "Step 2: Deploy Firestore Rules"
echo "Run this command after logging in:"
echo "npx firebase deploy --only firestore:rules"
echo ""

echo "Step 3: Verify Deployment"
echo "Check Firebase Console:"
echo "https://console.firebase.google.com/project/estimate-analyzer-ca4c6/firestore/rules"
echo ""

echo "Current Rules (Temporary - Permissive for Testing):"
echo "=================================================="
cat firestore.rules
echo ""

echo "⚠️  IMPORTANT: These are temporary permissive rules for testing."
echo "   After testing, we'll update them to be more secure."
echo ""

echo "🚀 Ready to deploy? Run the commands above!"
