/**
 * Validation utilities for PDF parsing and data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate extracted estimate data
 */
export function validateEstimateData(data: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Required fields validation
  if (!data.customerName || data.customerName.trim() === '') {
    result.errors.push('Customer name is required');
    result.isValid = false;
  }

  if (!data.claimNumber || data.claimNumber.trim() === '') {
    result.errors.push('Claim number is required');
    result.isValid = false;
  }

  if (!data.insuranceCompany || data.insuranceCompany.trim() === '') {
    result.errors.push('Insurance company is required');
    result.isValid = false;
  }

  // Financial validation
  if (!data.totals || typeof data.totals !== 'object') {
    result.errors.push('Totals section is missing or invalid');
    result.isValid = false;
  } else {
    // Validate insurance pay is present and positive
    if (typeof data.totals.insurancePay !== 'number' || data.totals.insurancePay <= 0) {
      result.errors.push('Insurance pay amount is missing or invalid');
      result.isValid = false;
    }

    // Validate numeric fields
    const numericFields = ['parts', 'labor', 'paintSupplies', 'misc', 'otherCharges', 'subtotal', 'salesTax'];
    for (const field of numericFields) {
      if (typeof data.totals[field] !== 'number' || data.totals[field] < 0) {
        result.warnings.push(`${field} amount is missing or invalid`);
      }
    }

    // Validate subtotal calculation (approximate)
    const calculatedSubtotal = data.totals.parts + data.totals.labor + 
                              data.totals.paintSupplies + data.totals.misc + data.totals.otherCharges;
    
    if (Math.abs(calculatedSubtotal - data.totals.subtotal) > 0.01) {
      result.warnings.push('Subtotal does not match sum of line items');
    }

    // Validate insurance pay vs subtotal + tax
    const expectedTotal = data.totals.subtotal + data.totals.salesTax;
    if (Math.abs(expectedTotal - data.totals.insurancePay) > 0.01) {
      result.warnings.push('Insurance pay does not match subtotal + tax');
    }
  }

  // Vehicle information warnings
  if (!data.vehicle?.year) {
    result.warnings.push('Vehicle year is missing');
  }
  if (!data.vehicle?.make) {
    result.warnings.push('Vehicle make is missing');
  }
  if (!data.vehicle?.model) {
    result.warnings.push('Vehicle model is missing');
  }

  // Job number warning (optional but useful)
  if (!data.jobNumber) {
    result.warnings.push('Job number is missing (optional)');
  }

  return result;
}

/**
 * Sanitize and clean extracted text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate and format currency values
 */
export function validateCurrency(value: any): number {
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }

  if (typeof value === 'string') {
    // Remove currency symbols and parse
    const cleaned = value.replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.round(parsed * 100) / 100;
    }
  }

  return 0;
}

/**
 * Validate VIN format (basic check)
 */
export function validateVIN(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false;
  }

  // Basic VIN validation: 17 characters, alphanumeric (excluding I, O, Q)
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(vin.toUpperCase());
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if text contains common PDF extraction issues
 */
export function detectExtractionIssues(text: string): string[] {
  const issues: string[] = [];

  if (!text || text.length < 100) {
    issues.push('Text is too short - possible extraction failure');
  }

  // Check for common OCR artifacts
  if (text.includes('|||') || text.includes('###') || text.includes('...')) {
    issues.push('Text contains possible OCR artifacts');
  }

  // Check for garbled text (too many special characters)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    issues.push('Text contains high ratio of special characters');
  }

  // Check for lack of common estimate keywords
  const keywords = ['estimate', 'total', 'parts', 'labor', 'customer', 'claim'];
  const foundKeywords = keywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  if (foundKeywords.length < 3) {
    issues.push('Text missing common estimate keywords');
  }

  return issues;
}
