import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as pdfParse from 'pdf-parse';
import { google } from 'googleapis';
import { withRetry, ProcessingError, logError } from './utils/retry';
import { validateEstimateData, sanitizeText, validateCurrency, detectExtractionIssues } from './utils/validation';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Google Sheets configuration
const GOOGLE_SHEETS_ID = functions.config().sheets?.sheet_id || process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_KEY = functions.config().service_account || process.env.SERVICE_ACCOUNT_KEY;

// PDF Processing Function
export const processPDF = onObjectFinalized({
  bucket: 'estimate-analyzer-ca4c6.firebasestorage.app',
}, async (event) => {
  const filePath = event.data.name;
  
  // Only process PDFs in the estimates folder
  if (!filePath.startsWith('estimates/') || !filePath.endsWith('.pdf')) {
    return;
  }

  console.log(`Processing PDF: ${filePath}`);

  try {
    const estimateId = generateEstimateId(filePath);
    const pdfUrl = `gs://${event.data.bucket}/${filePath}`;

    // Download and extract PDF with retry logic
    const extractedData = await withRetry(async () => {
      const file = storage.bucket().file(filePath);
      const [fileBuffer] = await file.download();

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new ProcessingError('Downloaded file is empty', { filePath });
      }

      // Extract text from PDF
      const pdfData = await pdfParse.default(fileBuffer);
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new ProcessingError('No text content extracted from PDF', { filePath });
      }

      // Check for extraction issues
      const extractionIssues = detectExtractionIssues(pdfData.text);
      if (extractionIssues.length > 0) {
        console.warn('PDF extraction issues detected:', extractionIssues);
      }

      return await parseEstimateData(pdfData.text);
    }, { maxRetries: 2 });

    // Validate extracted data
    const validation = validateEstimateData(extractedData);
    if (!validation.isValid) {
      throw new ProcessingError('Data validation failed', { 
        errors: validation.errors,
        warnings: validation.warnings,
        estimateId 
      });
    }

    // Calculate estimate profit
    const estimateProfit = calculateEstimateProfit(extractedData.totals);

    const estimateDoc = {
      ...extractedData,
      profits: {
        estimateProfit,
        actualPartsCost: null,
        actualProfit: null
      },
      pdfUrl,
      parseConfidence: calculateConfidence(extractedData),
      status: determineStatus(extractedData, validation),
      validationWarnings: validation.warnings,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore with retry
    await withRetry(async () => {
      await db.collection('estimates').doc(estimateId).set(estimateDoc);
    });

    // Append to Google Sheets if parsing was successful
    if (estimateDoc.status === 'parsed') {
      try {
        await withRetry(async () => {
          await appendToGoogleSheets(estimateDoc, estimateId);
        }, { maxRetries: 3 });
      } catch (sheetsError) {
        // Don't fail the entire process if Sheets fails
        logError(sheetsError as Error, { estimateId, operation: 'appendToGoogleSheets' });
        
        // Update status to indicate Sheets issue
        await db.collection('estimates').doc(estimateId).update({
          status: 'needs_review',
          sheetsError: (sheetsError as Error).message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`Successfully processed estimate: ${estimateId}`);

  } catch (error) {
    const estimateId = generateEstimateId(filePath);
    logError(error as Error, { estimateId, filePath, operation: 'processPDF' });
    
    // Create error document in Firestore
    await withRetry(async () => {
      await db.collection('estimates').doc(estimateId).set({
        status: 'error',
        error: (error as Error).message,
        errorDetails: error instanceof ProcessingError ? error.context : undefined,
        pdfUrl: `gs://${event.data.bucket}/${filePath}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }, { maxRetries: 1 });
  }
});

// Upload trigger function
export const processUpload = onDocumentCreated('uploads/{uploadId}', async (event) => {
  const uploadData = event.data?.data();
  if (!uploadData || uploadData.status !== 'queued') {
    return;
  }

  const uploadId = event.params.uploadId;
  
  try {
    // Update status to processing
    await db.collection('uploads').doc(uploadId).update({
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // The actual PDF processing will be handled by the storage trigger
    // This function just manages the upload status

  } catch (error: any) {
    console.error(`Error processing upload ${uploadId}:`, error);
    await db.collection('uploads').doc(uploadId).update({
      status: 'error',
      error: error.message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

// Parse estimate data from PDF text
async function parseEstimateData(text: string): Promise<any> {
  const lines = text.split('\n').map(line => line.trim());
  
  const data = {
    jobNumber: null as string | null,
    customerName: '',
    claimNumber: '',
    insuranceCompany: '',
    vehicle: {
      year: null as number | null,
      make: null as string | null,
      model: null as string | null,
      vin: null as string | null
    },
    totals: {
      parts: 0,
      labor: 0,
      paintSupplies: 0,
      misc: 0,
      otherCharges: 0,
      subtotal: 0,
      salesTax: 0,
      insurancePay: 0
    },
    estimateDate: null as string | null,
    preparedBy: null as string | null,
    pageCount: 1
  };

  // Parse basic information from first page
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const nextLine = lines[i + 1] || '';

    // Customer/Owner/Insured
    if ((line.includes('owner:') || line.includes('customer:') || line.includes('insured:')) && !data.customerName) {
      data.customerName = sanitizeText(extractValue(line, nextLine) || '');
    }

    // Claim Number
    if ((line.includes('claim') && (line.includes('#') || line.includes('number'))) && !data.claimNumber) {
      data.claimNumber = sanitizeText(extractValue(line, nextLine) || '');
    }

    // Insurance Company
    if ((line.includes('insurance') && line.includes('company')) || line.includes('insurer:')) {
      data.insuranceCompany = sanitizeText(extractValue(line, nextLine) || '');
    }

    // Job/RO/Workfile ID
    if ((line.includes('ro') || line.includes('repair order') || line.includes('workfile') || line.includes('estimate #')) && !data.jobNumber) {
      data.jobNumber = extractValue(line, nextLine);
    }

    // Vehicle information
    if (line.includes('year:') && !data.vehicle.year) {
      const yearStr = extractValue(line, nextLine);
      data.vehicle.year = yearStr ? parseInt(yearStr) : null;
    }
    if (line.includes('make:') && !data.vehicle.make) {
      data.vehicle.make = extractValue(line, nextLine);
    }
    if (line.includes('model:') && !data.vehicle.model) {
      data.vehicle.model = extractValue(line, nextLine);
    }
    if (line.includes('vin:') && !data.vehicle.vin) {
      data.vehicle.vin = extractValue(line, nextLine);
    }
  }

  // Parse totals section
  await parseTotalsSection(lines, data.totals);

  return data;
}

// Extract value from line or next line
function extractValue(line: string, nextLine: string): string | null {
  // Try to extract from same line first
  const colonIndex = line.indexOf(':');
  if (colonIndex !== -1) {
    const value = line.substring(colonIndex + 1).trim();
    if (value && value !== '') {
      return value;
    }
  }

  // If not found in same line, check next line
  if (nextLine && nextLine.trim() !== '') {
    return nextLine.trim();
  }

  return null;
}

// Parse the totals section
async function parseTotalsSection(lines: string[], totals: any): Promise<void> {
  let inTotalsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Detect totals section
    if (line.includes('estimate total') || line.includes('summary') || line.includes('totals')) {
      inTotalsSection = true;
      continue;
    }

    if (inTotalsSection) {
      // Parse different categories
      if (line.includes('parts') && !line.includes('labor')) {
        totals.parts = extractCurrency(line) || totals.parts;
      }
      
      // Aggregate all labor categories
      if (line.includes('labor')) {
        const laborAmount = extractCurrency(line) || 0;
        totals.labor += laborAmount;
      }
      
      // Paint supplies/materials
      if ((line.includes('paint') && (line.includes('supplies') || line.includes('materials')))) {
        totals.paintSupplies = extractCurrency(line) || totals.paintSupplies;
      }
      
      // Miscellaneous
      if (line.includes('misc') || line.includes('miscellaneous')) {
        totals.misc = extractCurrency(line) || totals.misc;
      }
      
      // Other charges
      if ((line.includes('other') && (line.includes('charges') || line.includes('fees')))) {
        totals.otherCharges = extractCurrency(line) || totals.otherCharges;
      }
      
      // Subtotal
      if (line.includes('subtotal')) {
        totals.subtotal = extractCurrency(line) || totals.subtotal;
      }
      
      // Sales tax
      if (line.includes('sales') && line.includes('tax')) {
        totals.salesTax = extractCurrency(line) || totals.salesTax;
      }
      
      // Insurance pay (final total)
      if ((line.includes('insurance') && line.includes('pay')) || 
          line.includes('net total') || 
          line.includes('grand total')) {
        totals.insurancePay = extractCurrency(line) || totals.insurancePay;
      }
    }
  }
}

// Extract currency value from line
function extractCurrency(line: string): number | null {
  const matches = line.match(/\$?([\d,]+\.?\d*)/);
  if (matches) {
    return validateCurrency(matches[1]);
  }
  return null;
}

// Calculate estimate profit
function calculateEstimateProfit(totals: any): number {
  return totals.insurancePay - (totals.parts + totals.paintSupplies + totals.misc + totals.otherCharges);
}

// Calculate parsing confidence
function calculateConfidence(data: any): number {
  let score = 0;
  let total = 0;

  // Required fields
  if (data.customerName) score += 20;
  total += 20;
  
  if (data.claimNumber) score += 20;
  total += 20;
  
  if (data.insuranceCompany) score += 20;
  total += 20;
  
  if (data.totals.insurancePay > 0) score += 20;
  total += 20;

  // Optional but important fields
  if (data.jobNumber) score += 5;
  total += 5;
  
  if (data.vehicle.year) score += 5;
  total += 5;
  
  if (data.totals.parts > 0) score += 5;
  total += 5;
  
  if (data.totals.labor > 0) score += 5;
  total += 5;

  return total > 0 ? score / total : 0;
}

// Determine status based on confidence and validation results
function determineStatus(data: any, validation?: any): 'parsed' | 'needs_review' | 'error' {
  const confidence = calculateConfidence(data);
  
  // If validation failed, needs review
  if (validation && !validation.isValid) {
    return 'needs_review';
  }
  
  // Check required fields
  if (!data.customerName || !data.insuranceCompany || data.totals.insurancePay <= 0) {
    return 'needs_review';
  }
  
  // Check confidence threshold
  if (confidence < 0.85) {
    return 'needs_review';
  }
  
  // Check if there are validation warnings
  if (validation && validation.warnings.length > 2) {
    return 'needs_review';
  }
  
  return 'parsed';
}

// Generate estimate ID from file path
function generateEstimateId(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace('.pdf', '');
}

// Append row to Google Sheets
async function appendToGoogleSheets(estimate: any, estimateId: string): Promise<void> {
  if (!GOOGLE_SHEETS_ID || !SERVICE_ACCOUNT_KEY) {
    console.warn('Google Sheets integration not configured');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const values = [
      [
        estimate.estimateDate || new Date().toISOString().split('T')[0], // Date
        estimate.jobNumber || '', // Job #
        estimate.customerName, // Customer
        estimate.claimNumber, // Claim #
        estimate.insuranceCompany, // Insurance
        estimate.vehicle.year || '', // Year
        estimate.vehicle.make || '', // Make
        estimate.vehicle.model || '', // Model
        estimate.vehicle.vin || '', // VIN
        estimate.totals.parts, // Parts (Estimate)
        estimate.totals.labor, // Labor (Total)
        estimate.totals.paintSupplies, // Paint Supplies
        estimate.totals.misc, // Misc
        estimate.totals.otherCharges, // Other
        estimate.totals.subtotal, // Subtotal
        estimate.totals.salesTax, // Sales Tax
        estimate.totals.insurancePay, // Insurance Pay
        '', // Estimate Profit (formula)
        '', // Actual Parts Cost (manual)
        '', // Actual Profit (formula)
        estimate.pdfUrl, // PDF Link
        estimate.status === 'parsed' ? 'Parsed' : 'Needs Review' // Status
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Estimates!A:V',
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });

    console.log(`Successfully appended estimate ${estimateId} to Google Sheets`);

  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

// Health check function
export const healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Check recent estimates
    const recentEstimates = await db.collection('estimates')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      recentEstimates: recentEstimates.size,
      errors: 0
    };

    // Count recent errors
    const recentErrors = await db.collection('estimates')
      .where('status', '==', 'error')
      .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .get();

    health.errors = recentErrors.size;

    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
