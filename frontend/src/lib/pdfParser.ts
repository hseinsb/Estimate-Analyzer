import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set up PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch (error) {
  console.warn('Failed to set PDF.js worker, using fallback:', error);
  // Fallback to CDN if local worker fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ExtractedData {
  customer: string;
  jobNumber: string | null;
  claimNumber: string;
  insuranceCompany: string;
  vehicle: {
    year: string | null;
    make: string | null;
    model: string | null;
    vin: string | null;
  };
  totals: {
    parts: number;
    bodyLabor: number;
    paintLabor: number;
    mechanicalLabor: number;
    frameLabor: number;
    paintSupplies: number;
    miscellaneous: number;
    otherCharges: number;
    subtotal: number;
    salesTax: number;
    grandTotal: number;
    insurancePay: number;
    customerPay: number; // Deductible (Customer Pay)
    totalLabor: number; // Sum of all labor types
  };
  pageCount: number;
}

/**
 * Parse a PDF file and extract estimate data
 */
export async function parsePDF(file: File): Promise<ExtractedData> {
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with error handling
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      disableAutoFetch: true,
      disableStream: true
    }).promise;
    
    // Extract text from specific pages only
    const pageCount = pdf.numPages;
    console.log('📄 Total pages:', pageCount);
    
    // 1. Extract Page 1 (customer/vehicle info)
    const page1 = await pdf.getPage(1);
    const page1TextContent = await page1.getTextContent();
    const page1Text = page1TextContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => item.str)
      .join(' ');
    
    console.log('📄 Page 1 text (first 500 chars):', page1Text.substring(0, 500));
    
    // 2. Find and extract "Estimate Totals" page (totals)
    let totalsPageText = '';
    let totalsPageNumber = 0;
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
      
      // Look for "ESTIMATE TOTAL" keyword (more flexible matching)
      if (pageText.toLowerCase().includes('estimate total')) {
        totalsPageText = pageText;
        totalsPageNumber = pageNum;
        console.log('📄 Found Estimate Totals on page:', pageNum);
        console.log('📄 Totals page text (first 500 chars):', pageText.substring(0, 500));
        break;
      }
    }
    
    if (!totalsPageText) {
      console.warn('⚠️ Estimate Totals page not found, using last page as fallback');
      const lastPage = await pdf.getPage(pageCount);
      const lastPageTextContent = await lastPage.getTextContent();
      totalsPageText = lastPageTextContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
      totalsPageNumber = pageCount;
    }
    
    // Parse the extracted text from specific pages
    const extractedData = parseEstimateText(page1Text, totalsPageText, pageCount, totalsPageNumber);
    
    return extractedData;
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF. Please ensure it\'s a valid CCC One estimate.');
  }
}

/**
 * Parse estimate data from specific pages only
 * Page 1: Customer/Vehicle info
 * Estimate Totals page: Financial totals
 */
function parseEstimateText(page1Text: string, totalsPageText: string, pageCount: number, totalsPageNumber: number): ExtractedData {
  console.log('🔍 Parsing Page 1 for customer/vehicle info');
  console.log('🔍 Parsing Page', totalsPageNumber, 'for financial totals');
  
  const data: ExtractedData = {
    customer: '',
    jobNumber: null,
    claimNumber: '',
    insuranceCompany: '',
    vehicle: {
      year: null,
      make: null,
      model: null,
      vin: null
    },
    totals: {
      parts: 0.00,
      bodyLabor: 0.00,
      paintLabor: 0.00,
      mechanicalLabor: 0.00,
      frameLabor: 0.00,
      paintSupplies: 0.00,
      miscellaneous: 0.00,
      otherCharges: 0.00,
      subtotal: 0.00,
      salesTax: 0.00,
      grandTotal: 0.00,
      insurancePay: 0.00,
      customerPay: 0.00,
      totalLabor: 0.00
    },
    pageCount
  };

  // Parse Page 1 for customer/vehicle info
  parsePage1Info(page1Text, data);
  
  // Parse totals page for financial data
  parseTotalsPageInfo(totalsPageText, data);

  // Debug: Log final parsed data
  console.log('🔍 Final parsed data:', data);

  return data;
}

/**
 * Parse Page 1 for customer and vehicle information using regex anchoring
 * Only extracts values next to specific labels
 */
function parsePage1Info(page1Text: string, data: ExtractedData): void {
  console.log('🔍 Page 1 text length:', page1Text.length);
  console.log('🔍 Page 1 first 500 chars:', page1Text.substring(0, 500));
  
  // Use precise regex to extract only the clean values, not everything after
  
  // Customer Name: Extract "REYNA, VICTORIA" - could be same line or next line
  let customerMatch = page1Text.match(/Customer\s+Name\s+([A-Z\s,]+?)(?:\s+Job\s+Number|\s+Written|$)/i);
  if (!customerMatch) {
    // Try alternate pattern where name is on the next line
    customerMatch = page1Text.match(/Customer\s+Name\s*\n?\s*([A-Z\s,]+?)(?:\s+Job\s+Number|\s+Written|$)/i);
  }
  if (!customerMatch) {
    // Try pattern where it's just "Customer:" followed by name
    customerMatch = page1Text.match(/Customer:\s*([A-Z\s,]+?)(?:\s+Job\s+Number|\s+Written|$)/i);
  }
  if (customerMatch) {
    data.customer = sanitizeText(customerMatch[1].trim()) || '';
    console.log('🔍 Found Customer:', data.customer);
  } else {
    console.log('🔍 Customer name not found - trying debug...');
    console.log('🔍 Page 1 text around Customer:', page1Text.substring(0, 200));
  }
  
  // Job Number: Extract just "3885" from "Job Number: 3885 Written By:..."
  const jobNumberMatch = page1Text.match(/Job\s+Number:\s*(\d+)/i);
  if (jobNumberMatch) {
    data.jobNumber = sanitizeText(jobNumberMatch[1].trim());
    console.log('🔍 Found Job Number:', data.jobNumber);
  }
  
  // Claim #: Extract just "402189408ZCBD001-01" from "Claim #: 402189408ZCBD001-01 Type of Loss:..."
  const claimMatch = page1Text.match(/Claim\s*#:\s*([A-Z0-9\-]+)/i);
  if (claimMatch) {
    data.claimNumber = sanitizeText(claimMatch[1].trim()) || '';
    console.log('🔍 Found Claim #:', data.claimNumber);
  }
  
      // Insurance Company: Use targeted search approach
      console.log('🔍 Looking for Insurance Company using targeted search...');
      
      // Find the exact position of "Insurance Company:" in the text
      const insuranceIndex = page1Text.toLowerCase().indexOf('insurance company:');
      if (insuranceIndex !== -1) {
        // Extract text starting from "Insurance Company:" position
        const fromInsurance = page1Text.substring(insuranceIndex);
        console.log('🔍 Text from Insurance Company:', fromInsurance.substring(0, 200));
        
        // Since PDF text extraction flattens the layout, we need to find the insurance company name
        // that appears after "Insurance Company:" in the text stream
        const afterLabel = fromInsurance.substring('insurance company:'.length).trim();
        console.log('🔍 Text after Insurance Company label:', afterLabel.substring(0, 150));
        
        // Use multiple strategies to find the insurance company name
        let companyName = '';
        
        // Strategy 1: Look for text containing "INSURANCE" 
        const insuranceMatch = afterLabel.match(/([A-Z\-\s]+INSURANCE[A-Z\s]*)/i);
        if (insuranceMatch) {
          companyName = insuranceMatch[1].trim();
          console.log('🔍 Strategy 1 - Found with INSURANCE pattern:', companyName);
        }
        
        // Strategy 2: Look for common insurance company names (without "INSURANCE")
        if (!companyName) {
          const commonInsurers = [
            'STATE FARM', 'GEICO', 'ALLSTATE', 'PROGRESSIVE', 'FARMERS', 
            'LIBERTY MUTUAL', 'USAA', 'NATIONWIDE', 'TRAVELERS', 'AMERICAN FAMILY',
            'AUTO CLUB', 'MEEMIC', 'BRISTOL WEST', 'ESURANCE', 'SAFECO'
          ];
          
          for (const insurer of commonInsurers) {
            if (afterLabel.toUpperCase().includes(insurer)) {
              companyName = insurer;
              console.log('🔍 Strategy 2 - Found common insurer:', companyName);
              break;
            }
          }
        }
        
        // Strategy 3: Extract the first sequence of capitalized words after filtering out known non-insurance terms
        if (!companyName) {
          const words = afterLabel.split(/\s+/);
          let candidateWords = [];
          
          console.log('🔍 Strategy 3 - All words after label:', words.slice(0, 15));
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i].trim().replace(/[,.:;]/g, ''); // Remove punctuation
            
            // Skip common non-insurance words
            if (/^(WAGNER|MERILYN|OTHER|TROY|VEHICLE|INSPECTION|LOCATION|OWNER|HOME|BUSINESS|\d+|[A-Z]{2}|\([^)]*\))$/i.test(word)) {
              console.log(`🔍 Skipping non-insurance word: ${word}`);
              if (candidateWords.length > 0) break; // Stop if we were building a name
              continue;
            }
            
            // Collect capitalized words that could be company names
            if (/^[A-Z][A-Z\-]*$/i.test(word) && word.length > 1) {
              candidateWords.push(word.toUpperCase());
              console.log(`🔍 Adding candidate word: ${word}`);
              
              // Stop after collecting a reasonable company name (2-4 words)
              if (candidateWords.length >= 4) break;
            } else if (candidateWords.length > 0) {
              // Stop if we hit a non-company word after starting to collect
              break;
            }
          }
          
          if (candidateWords.length > 0) {
            companyName = candidateWords.join(' ');
            console.log('🔍 Strategy 3 - Extracted candidate words:', candidateWords);
          }
        }
        
        if (companyName) {
          // Clean up the company name
          companyName = companyName.replace(/\s+(AVENUE|AVE|STREET|ST|DRIVE|DR|BLVD|BOULEVARD|ROAD|RD|LANE|LN|CIRCLE|CIR|COURT|CT|PLACE|PL).*$/gi, '');
          companyName = companyName.replace(/\s+\d+.*$/g, ''); // Remove numbers and everything after
          companyName = companyName.replace(/\s+\([0-9].*$/g, ''); // Remove phone numbers  
          companyName = companyName.replace(/\s+Business\s*$/gi, ''); // Remove "Business" at end
          companyName = companyName.trim();
          
          console.log('🔍 Final cleaned company name:', companyName);
          data.insuranceCompany = sanitizeText(companyName) || '';
        } else {
          console.log('🔍 No insurance company found with any strategy');
          data.insuranceCompany = '';
        }
      } else {
        console.log('🔍 "Insurance Company:" label not found in text');
        data.insuranceCompany = '';
      }
  
  // VEHICLE section: Extract clean values from "2021 GMC Sierra 1500..." format
  
  // Year: Extract "2021" from "2021 GMC Sierra 1500..."
  const yearMatch = page1Text.match(/VEHICLE\s+(\d{4})/i);
  if (yearMatch) {
    data.vehicle.year = sanitizeText(yearMatch[1].trim());
    console.log('🔍 Found Year:', data.vehicle.year);
  }
  
  // Make: Extract "GMC" from "2021 GMC Sierra 1500..."
  const makeMatch = page1Text.match(/VEHICLE\s+\d{4}\s+([A-Z]+)/i);
  if (makeMatch) {
    data.vehicle.make = sanitizeText(makeMatch[1].trim());
    console.log('🔍 Found Make:', data.vehicle.make);
  }
  
  // Model: Extract "Sierra 1500" from "2021 GMC Sierra 1500 Elevation..."
  const modelMatch = page1Text.match(/VEHICLE\s+\d{4}\s+[A-Z]+\s+([A-Z0-9\s]+?)(?:\s+Elevation|\s+Crew|\s+VIN|$)/i);
  if (modelMatch) {
    data.vehicle.model = sanitizeText(modelMatch[1].trim());
    console.log('🔍 Found Model:', data.vehicle.model);
  }
  
  // VIN: Extract "1GTU9CED6MZ233614" from "VIN: 1GTU9CED6MZ233614"
  const vinMatch = page1Text.match(/VIN:\s*([A-Z0-9]{17})/i);
  if (vinMatch) {
    data.vehicle.vin = sanitizeText(vinMatch[1].trim());
    console.log('🔍 Found VIN:', data.vehicle.vin);
  }
}

/**
 * Parse Estimate Totals page using regex anchoring
 * Only extracts values next to specific Category labels
 */
function parseTotalsPageInfo(totalsPageText: string, data: ExtractedData): void {
  console.log('🔍 Totals page text length:', totalsPageText.length);
  console.log('🔍 Totals page first 500 chars:', totalsPageText.substring(0, 500));
  
  // Initialize all totals to 0.00 (normalization rule)
  data.totals.parts = 0.00;
  data.totals.bodyLabor = 0.00;
  data.totals.paintLabor = 0.00;
  data.totals.mechanicalLabor = 0.00;
  data.totals.frameLabor = 0.00;
  data.totals.paintSupplies = 0.00;
  data.totals.miscellaneous = 0.00;
  data.totals.otherCharges = 0.00;
  data.totals.subtotal = 0.00;
  data.totals.salesTax = 0.00;
  data.totals.grandTotal = 0.00;
  data.totals.insurancePay = 0.00;
  data.totals.customerPay = 0.00;
  data.totals.totalLabor = 0.00;
  
  // Use regex anchoring to extract only values next to specific labels
  const partsMatch = totalsPageText.match(/Parts\s*\$?([\d,]+\.?\d*)/i);
  if (partsMatch) {
    data.totals.parts = normalizeCurrency(parseFloat(partsMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Parts:', data.totals.parts);
  }
  
  // Labor - find ALL lines containing "Labor" and extract the cost (last number)
  // Format: "Body Labor 5.7 hrs @ $ 58.00 / hr 330.60"
  // We want the last number (330.60) and sum all labor types
  let totalLabor = 0.00;
  const laborPattern = /(\w+\s*Labor)\s*[\d.]+\s*hrs\s*@\s*\$\s*[\d.]+\s*\/\s*hr\s*([\d,]+\.?\d*)/gi;
  let laborMatch;
  
  console.log('🔍 Searching for ALL Labor types...');
  while ((laborMatch = laborPattern.exec(totalsPageText)) !== null) {
    const laborType = laborMatch[1]; // e.g., "Body Labor"
    const cost = parseFloat(laborMatch[2].replace(/,/g, '')); // e.g., 330.60
    const normalizedCost = normalizeCurrency(cost);
    
    console.log(`🔍 Found ${laborType}: ${normalizedCost}`);
    totalLabor += normalizedCost;
    
    // Store individual labor types for backward compatibility
    if (laborType.toLowerCase().includes('body')) {
      data.totals.bodyLabor = normalizedCost;
    } else if (laborType.toLowerCase().includes('paint')) {
      data.totals.paintLabor = normalizedCost;
    } else if (laborType.toLowerCase().includes('mechanical')) {
      data.totals.mechanicalLabor = normalizedCost;
    } else if (laborType.toLowerCase().includes('frame')) {
      data.totals.frameLabor = normalizedCost;
    }
  }
  
  console.log('🔍 TOTAL LABOR (sum of all labor types):', totalLabor);
  
  // Store the total labor sum (this will be used in UploadForm for Firestore)
  data.totals.totalLabor = totalLabor;
  
  // Paint Supplies - target the specific format: "Paint Supplies 3.5 hrs @ $ 42.00 / hr 147.00"
  // We want the last number (147.00) which is the actual cost
  const paintSuppliesMatch = totalsPageText.match(/Paint\s*Supplies\s*[\d.]+\s*hrs\s*@\s*\$\s*[\d.]+\s*\/\s*hr\s*([\d,]+\.?\d*)/i);
  if (paintSuppliesMatch) {
    console.log('🔍 Paint Supplies FULL MATCH:', paintSuppliesMatch[0]);
    console.log('🔍 Paint Supplies EXTRACTED NUMBER (cost):', paintSuppliesMatch[1]);
    data.totals.paintSupplies = normalizeCurrency(parseFloat(paintSuppliesMatch[1].replace(/,/g, '')));
    console.log('🔍 Paint Supplies FINAL VALUE:', data.totals.paintSupplies);
  } else {
    // Fallback: try to get the last number on the Paint Supplies line
    const paintSuppliesFallback = totalsPageText.match(/Paint\s*Supplies.*?([\d,]+\.?\d*)\s*$/im);
    if (paintSuppliesFallback) {
      console.log('🔍 Paint Supplies FALLBACK MATCH:', paintSuppliesFallback[0]);
      console.log('🔍 Paint Supplies FALLBACK NUMBER:', paintSuppliesFallback[1]);
      data.totals.paintSupplies = normalizeCurrency(parseFloat(paintSuppliesFallback[1].replace(/,/g, '')));
      console.log('🔍 Paint Supplies FALLBACK FINAL:', data.totals.paintSupplies);
    } else {
      console.log('🔍 Paint Supplies: NO MATCH FOUND');
    }
  }
  
  const miscellaneousMatch = totalsPageText.match(/Miscellaneous\s*\$?([\d,]+\.?\d*)/i);
  if (miscellaneousMatch) {
    data.totals.miscellaneous = normalizeCurrency(parseFloat(miscellaneousMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Miscellaneous:', data.totals.miscellaneous);
  }
  
  const otherChargesMatch = totalsPageText.match(/Other\s*Charges\s*\$?([\d,]+\.?\d*)/i);
  if (otherChargesMatch) {
    data.totals.otherCharges = normalizeCurrency(parseFloat(otherChargesMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Other Charges:', data.totals.otherCharges);
  }
  
  const subtotalMatch = totalsPageText.match(/Subtotal\s*\$?([\d,]+\.?\d*)/i);
  if (subtotalMatch) {
    data.totals.subtotal = normalizeCurrency(parseFloat(subtotalMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Subtotal:', data.totals.subtotal);
  }
  
  // Sales Tax - target the specific format: "Sales Tax $ 1,751.58 @ 6.0000 % 105.09"
  // We want the last number (105.09) which is the actual tax cost
  const salesTaxMatch = totalsPageText.match(/Sales\s*Tax\s*\$\s*[\d,]+\.?\d*\s*@\s*[\d.]+\s*%\s*([\d,]+\.?\d*)/i);
  if (salesTaxMatch) {
    console.log('🔍 Sales Tax FULL MATCH:', salesTaxMatch[0]);
    console.log('🔍 Sales Tax EXTRACTED NUMBER (cost):', salesTaxMatch[1]);
    data.totals.salesTax = normalizeCurrency(parseFloat(salesTaxMatch[1].replace(/,/g, '')));
    console.log('🔍 Sales Tax FINAL VALUE:', data.totals.salesTax);
  } else {
    // Fallback: try to get the last number on the Sales Tax line
    const salesTaxFallback = totalsPageText.match(/Sales\s*Tax.*?([\d,]+\.?\d*)\s*$/im);
    if (salesTaxFallback) {
      console.log('🔍 Sales Tax FALLBACK MATCH:', salesTaxFallback[0]);
      console.log('🔍 Sales Tax FALLBACK NUMBER:', salesTaxFallback[1]);
      data.totals.salesTax = normalizeCurrency(parseFloat(salesTaxFallback[1].replace(/,/g, '')));
      console.log('🔍 Sales Tax FALLBACK FINAL:', data.totals.salesTax);
    } else {
      console.log('🔍 Sales Tax: NO MATCH FOUND');
    }
  }
  
  const grandTotalMatch = totalsPageText.match(/Grand\s*Total\s*\$?([\d,]+\.?\d*)/i);
  if (grandTotalMatch) {
    data.totals.grandTotal = normalizeCurrency(parseFloat(grandTotalMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Grand Total:', data.totals.grandTotal);
  }
  
  // Customer Pay (Deductible) - optional field, appears above Insurance Pay
  const customerPayMatch = totalsPageText.match(/Customer\s*Pay\s*\$?([\d,]+\.?\d*)/i);
  if (customerPayMatch) {
    data.totals.customerPay = normalizeCurrency(parseFloat(customerPayMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Customer Pay (Deductible):', data.totals.customerPay);
  } else {
    console.log('🔍 Customer Pay not found (no deductible)');
  }
  
  const insurancePayMatch = totalsPageText.match(/Insurance\s*Pay\s*\$?([\d,]+\.?\d*)/i);
  if (insurancePayMatch) {
    data.totals.insurancePay = normalizeCurrency(parseFloat(insurancePayMatch[1].replace(/,/g, '')));
    console.log('🔍 Found Insurance Pay:', data.totals.insurancePay);
  }
}


/**
 * Normalize currency to two decimal places
 * Strip $ signs, commas, and text - return pure numeric values
 */
function normalizeCurrency(value: number | null): number {
  if (value === null || isNaN(value)) {
    return 0.00;
  }
  return Math.round(value * 100) / 100; // Round to 2 decimal places
}

/**
 * Sanitize and clean extracted text
 */
function sanitizeText(text: string | null): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
    .substring(0, 1000); // Limit length
}

/**
 * Calculate estimate profit - Labor only (everything else is expenses)
 */
export function calculateEstimateProfit(totals: ExtractedData['totals']): number {
  // Profit = Total Labor only (parts, paint supplies, etc. are expenses)
  return totals.totalLabor;
}

/**
 * Calculate parsing confidence based on extracted data
 */
export function calculateConfidence(data: ExtractedData): number {
  let score = 0;
  let total = 0;

  // Required fields
  if (data.customer) score += 20;
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
  
  if (data.totals.totalLabor > 0) score += 5;
  total += 5;

  return total > 0 ? score / total : 0;
}

/**
 * Determine status based on confidence and required fields
 */
export function determineStatus(data: ExtractedData): 'parsed' | 'needs_review' | 'error' {
  const confidence = calculateConfidence(data);
  
  // Check required fields
  if (!data.customer || !data.insuranceCompany || data.totals.insurancePay <= 0) {
    return 'needs_review';
  }
  
  // Check confidence threshold
  if (confidence < 0.85) {
    return 'needs_review';
  }
  
  return 'parsed';
}
