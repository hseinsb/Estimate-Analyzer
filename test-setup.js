#!/usr/bin/env node

/**
 * Test Setup Script
 * Validates that the basic project structure and dependencies are correctly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Estimate Analyzer Setup...\n');

// Test 1: Check package.json files
console.log('1. Checking package.json files...');
const rootPackage = path.join(__dirname, 'package.json');
const frontendPackage = path.join(__dirname, 'frontend', 'package.json');
const functionsPackage = path.join(__dirname, 'functions', 'package.json');

if (fs.existsSync(rootPackage)) {
  console.log('   ✅ Root package.json exists');
} else {
  console.log('   ❌ Root package.json missing');
}

if (fs.existsSync(frontendPackage)) {
  console.log('   ✅ Frontend package.json exists');
} else {
  console.log('   ❌ Frontend package.json missing');
}

if (fs.existsSync(functionsPackage)) {
  console.log('   ✅ Functions package.json exists');
} else {
  console.log('   ❌ Functions package.json missing');
}

// Test 2: Check Firebase configuration
console.log('\n2. Checking Firebase configuration...');
const firebaseJson = path.join(__dirname, 'firebase.json');
const firestoreRules = path.join(__dirname, 'firestore.rules');
const storageRules = path.join(__dirname, 'storage.rules');

if (fs.existsSync(firebaseJson)) {
  console.log('   ✅ firebase.json exists');
} else {
  console.log('   ❌ firebase.json missing');
}

if (fs.existsSync(firestoreRules)) {
  console.log('   ✅ firestore.rules exists');
} else {
  console.log('   ❌ firestore.rules missing');
}

if (fs.existsSync(storageRules)) {
  console.log('   ✅ storage.rules exists');
} else {
  console.log('   ❌ storage.rules missing');
}

// Test 3: Check Cloud Functions structure
console.log('\n3. Checking Cloud Functions structure...');
const functionsIndex = path.join(__dirname, 'functions', 'src', 'index.ts');
const retryUtils = path.join(__dirname, 'functions', 'src', 'utils', 'retry.ts');
const validationUtils = path.join(__dirname, 'functions', 'src', 'utils', 'validation.ts');

if (fs.existsSync(functionsIndex)) {
  console.log('   ✅ Functions index.ts exists');
} else {
  console.log('   ❌ Functions index.ts missing');
}

if (fs.existsSync(retryUtils)) {
  console.log('   ✅ Retry utilities exist');
} else {
  console.log('   ❌ Retry utilities missing');
}

if (fs.existsSync(validationUtils)) {
  console.log('   ✅ Validation utilities exist');
} else {
  console.log('   ❌ Validation utilities missing');
}

// Test 4: Check frontend structure
console.log('\n4. Checking frontend structure...');
const frontendIndex = path.join(__dirname, 'frontend', 'src', 'main.tsx');
const frontendApp = path.join(__dirname, 'frontend', 'src', 'App.tsx');
const firebaseLib = path.join(__dirname, 'frontend', 'src', 'lib', 'firebase.ts');
const uploadForm = path.join(__dirname, 'frontend', 'src', 'components', 'UploadForm.tsx');

if (fs.existsSync(frontendIndex)) {
  console.log('   ✅ Frontend main.tsx exists');
} else {
  console.log('   ❌ Frontend main.tsx missing');
}

if (fs.existsSync(frontendApp)) {
  console.log('   ✅ App.tsx exists');
} else {
  console.log('   ❌ App.tsx missing');
}

if (fs.existsSync(firebaseLib)) {
  console.log('   ✅ Firebase library exists');
} else {
  console.log('   ❌ Firebase library missing');
}

if (fs.existsSync(uploadForm)) {
  console.log('   ✅ Upload form component exists');
} else {
  console.log('   ❌ Upload form component missing');
}

// Test 5: Check environment setup
console.log('\n5. Checking environment setup...');
const envExample = path.join(__dirname, 'env.example');
const envFile = path.join(__dirname, '.env');

if (fs.existsSync(envExample)) {
  console.log('   ✅ env.example exists');
} else {
  console.log('   ❌ env.example missing');
}

if (fs.existsSync(envFile)) {
  console.log('   ✅ .env file exists');
} else {
  console.log('   ⚠️  .env file missing (copy from env.example and configure)');
}

// Test 6: Check documentation
console.log('\n6. Checking documentation...');
const readme = path.join(__dirname, 'README.md');
const setupScript = path.join(__dirname, 'setup.sh');

if (fs.existsSync(readme)) {
  console.log('   ✅ README.md exists');
} else {
  console.log('   ❌ README.md missing');
}

if (fs.existsSync(setupScript)) {
  console.log('   ✅ Setup script exists');
} else {
  console.log('   ❌ Setup script missing');
}

// Summary
console.log('\n📋 Setup Test Complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run install:all');
console.log('2. Configure .env file with Firebase settings');
console.log('3. Set up Google Sheets and service account');
console.log('4. Initialize Firebase: firebase init');
console.log('5. Deploy rules: firebase deploy --only firestore:rules,storage:rules');
console.log('6. Start development: npm run dev');
console.log('\nSee README.md for detailed instructions.');
