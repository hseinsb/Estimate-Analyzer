import { ExtractedData } from './pdfParser';

// Google Sheets configuration from environment
const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID as string;
const SERVICE_ACCOUNT_KEY = import.meta.env.VITE_SERVICE_ACCOUNT_KEY as string;

interface GoogleSheetsResponse {
  success: boolean;
  error?: string;
}

/**
 * Append a row to Google Sheets using the Google Sheets API
 */
export async function appendToGoogleSheets(data: ExtractedData, estimateId: string): Promise<GoogleSheetsResponse> {
  if (!GOOGLE_SHEETS_ID || !SERVICE_ACCOUNT_KEY) {
    console.warn('Google Sheets integration not configured');
    return { success: false, error: 'Google Sheets not configured' };
  }

  try {
    // Get access token using service account
    const accessToken = await getServiceAccountToken();
    
    // Prepare row data
    const values = [
      [
        new Date().toISOString().split('T')[0], // Date
        data.jobNumber || '', // Job #
        data.customer, // Customer
        data.claimNumber, // Claim #
        data.insuranceCompany, // Insurance
        data.vehicle.year || '', // Year
        data.vehicle.make || '', // Make
        data.vehicle.model || '', // Model
        data.vehicle.vin || '', // VIN
        data.totals.parts, // Parts (Estimate)
        data.totals.totalLabor, // Labor (Total)
        data.totals.paintSupplies, // Paint Supplies
        data.totals.miscellaneous, // Misc
        data.totals.otherCharges, // Other
        data.totals.subtotal, // Subtotal
        data.totals.salesTax, // Sales Tax
        data.totals.insurancePay, // Insurance Pay
        '', // Estimate Profit (formula)
        '', // Actual Parts Cost (manual)
        '', // Actual Profit (formula)
        '', // PDF Link (null since no storage)
        'Parsed' // Status
      ]
    ];

    // Make API request to Google Sheets
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/Estimates!A:V:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Sheets API error: ${errorData.error?.message || response.statusText}`);
    }

    console.log(`Successfully appended estimate ${estimateId} to Google Sheets`);
    return { success: true };

  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get access token using service account credentials
 */
async function getServiceAccountToken(): Promise<string> {
  try {
    const credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
    
    // Create JWT for service account authentication
    const jwt = await createServiceAccountJWT(credentials);
    
    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('Error getting service account token:', error);
    throw error;
  }
}

/**
 * Create JWT for service account authentication
 */
async function createServiceAccountJWT(credentials: any): Promise<string> {
  // const header = {
  //   alg: 'RS256',
  //   typ: 'JWT'
  // };

  const now = Math.floor(Date.now() / 1000);
  // const payload = {
  //   iss: credentials.client_email,
  //   scope: 'https://www.googleapis.com/auth/spreadsheets',
  //   aud: 'https://oauth2.googleapis.com/token',
  //   exp: now + 3600, // 1 hour
  //   iat: now
  // };

  // Note: This is a simplified JWT creation for demonstration
  // In a real frontend app, you'd typically use a library like jose or jsonwebtoken
  // For now, we'll use a server endpoint or handle this differently
  
  // Since we can't do RSA signing in the browser easily, let's use a different approach
  throw new Error('JWT signing not implemented for frontend. Consider using a backend endpoint for Google Sheets integration.');
}

/**
 * Alternative: Use a backend endpoint for Google Sheets integration
 * This is safer and more secure than handling service account keys in the frontend
 */
export async function appendToGoogleSheetsViaBackend(data: ExtractedData, estimateId: string): Promise<GoogleSheetsResponse> {
  try {
    // This would call your backend endpoint
    const response = await fetch('/api/sheets/append', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        estimateId
      })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error calling backend for Google Sheets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Simple Google Sheets integration using Apps Script Web App
 * This is a workaround for frontend-only integration
 */
export async function appendToGoogleSheetsViaAppsScript(data: ExtractedData, estimateId: string): Promise<GoogleSheetsResponse> {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
  
  if (!APPS_SCRIPT_URL) {
    return { success: false, error: 'Apps Script URL not configured' };
  }

  try {
    // Try direct fetch first
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'appendRow',
        data: {
          date: new Date().toISOString().split('T')[0],
          jobNumber: data.jobNumber || '',
          customerName: data.customer,
          claimNumber: data.claimNumber,
          insuranceCompany: data.insuranceCompany,
          year: data.vehicle.year || '',
          make: data.vehicle.make || '',
          model: data.vehicle.model || '',
          vin: data.vehicle.vin || '',
          parts: data.totals.parts,
          bodyLabor: data.totals.bodyLabor,
          paintLabor: data.totals.paintLabor,
          mechanicalLabor: data.totals.mechanicalLabor,
          frameLabor: data.totals.frameLabor,
          totalLabor: data.totals.totalLabor,
          paintSupplies: data.totals.paintSupplies,
          miscellaneous: data.totals.miscellaneous,
          otherCharges: data.totals.otherCharges,
          subtotal: data.totals.subtotal,
          salesTax: data.totals.salesTax,
          grandTotal: data.totals.grandTotal,
          customerPay: data.totals.customerPay,
          insurancePay: data.totals.insurancePay,
          firestoreId: estimateId,
          status: 'Parsed'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Apps Script error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success || false, error: result.error };

  } catch (error) {
    console.error('Error calling Apps Script:', error);
    
    // If CORS fails, try alternative approach using JSONP-style technique
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('Attempting fallback approach for CORS...');
      return await attemptJSONPFallback(data, estimateId, APPS_SCRIPT_URL);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Fallback approach using dynamic script injection
async function attemptJSONPFallback(data: ExtractedData, estimateId: string, appsScriptUrl: string): Promise<GoogleSheetsResponse> {
  return new Promise((resolve) => {
    try {
      // Create a callback function name
      const callbackName = 'sheetsCallback_' + Date.now();
      
      // Set up the global callback
      (window as any)[callbackName] = (result: any) => {
        // Clean up
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) {
          script.remove();
        }
        
        resolve({ success: result.success || false, error: result.error });
      };
      
      // Prepare the data as URL parameters
      const params = new URLSearchParams({
        action: 'appendRow',
        callback: callbackName,
        customerName: data.customer,
        claimNumber: data.claimNumber,
        insuranceCompany: data.insuranceCompany,
        year: data.vehicle.year || '',
        make: data.vehicle.make || '',
        model: data.vehicle.model || '',
        vin: data.vehicle.vin || '',
        parts: data.totals.parts.toString(),
        totalLabor: data.totals.totalLabor.toString(),
        paintSupplies: data.totals.paintSupplies.toString(),
        miscellaneous: data.totals.miscellaneous.toString(),
        otherCharges: data.totals.otherCharges.toString(),
        subtotal: data.totals.subtotal.toString(),
        salesTax: data.totals.salesTax.toString(),
        grandTotal: data.totals.grandTotal.toString(),
        customerPay: data.totals.customerPay.toString(),
        insurancePay: data.totals.insurancePay.toString(),
        firestoreId: estimateId,
        status: 'Parsed'
      });
      
      // Create script element for JSONP
      const script = document.createElement('script');
      script.id = callbackName;
      script.src = `${appsScriptUrl}?${params.toString()}`;
      script.onerror = () => {
        delete (window as any)[callbackName];
        script.remove();
        resolve({ success: false, error: 'JSONP fallback failed' });
      };
      
      document.head.appendChild(script);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
          script.remove();
          resolve({ success: false, error: 'Request timeout' });
        }
      }, 30000);
      
    } catch (error) {
      resolve({ success: false, error: 'Fallback method failed' });
    }
  });
}
