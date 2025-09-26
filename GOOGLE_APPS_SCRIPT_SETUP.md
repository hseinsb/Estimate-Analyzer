# Google Apps Script Setup for Frontend Google Sheets Integration

Since we're using the Firebase Spark (free) plan and cannot use Cloud Functions, we'll use Google Apps Script to handle Google Sheets integration securely.

## Steps to Set Up Google Apps Script

### 1. Create a Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Replace the default code with the script below
4. Save the project with a meaningful name (e.g., "Estimate Analyzer Sheets Integration")

### 2. Apps Script Code

```javascript
function doPost(e) {
  try {
    // Parse the request body
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'appendRow') {
      return appendRowToSheet(data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appendRowToSheet(data) {
  try {
    // Replace with your Google Sheets ID
    const SHEET_ID = 'your-google-sheets-id-here';
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Estimates');
    
    if (!sheet) {
      throw new Error('Sheet "Estimates" not found');
    }
    
    // Prepare row data (columns A-V)
    const rowData = [
      data.date || new Date().toISOString().split('T')[0], // A: Date
      data.jobNumber || '', // B: Job #
      data.customerName || '', // C: Customer
      data.claimNumber || '', // D: Claim #
      data.insuranceCompany || '', // E: Insurance
      data.year || '', // F: Year
      data.make || '', // G: Make
      data.model || '', // H: Model
      data.vin || '', // I: VIN
      data.parts || 0, // J: Parts (Estimate)
      data.labor || 0, // K: Labor (Total)
      data.paintSupplies || 0, // L: Paint Supplies
      data.misc || 0, // M: Misc
      data.otherCharges || 0, // N: Other
      data.subtotal || 0, // O: Subtotal
      data.salesTax || 0, // P: Sales Tax
      data.insurancePay || 0, // Q: Insurance Pay
      '', // R: Estimate Profit (formula)
      '', // S: Actual Parts Cost (manual)
      '', // T: Actual Profit (formula)
      '', // U: PDF Link (empty for Spark plan)
      data.status || 'Parsed' // V: Status
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Sheet append error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function for debugging
function testAppendRow() {
  const testData = {
    date: '2024-01-01',
    customerName: 'Test Customer',
    claimNumber: 'TEST123',
    insuranceCompany: 'Test Insurance',
    parts: 1000,
    labor: 500,
    insurancePay: 1500,
    status: 'Parsed'
  };
  
  const result = appendRowToSheet(testData);
  Logger.log(result.getContent());
}
```

### 3. Configure the Script

1. **Replace Sheet ID**: Find your Google Sheets ID in the URL and replace `'your-google-sheets-id-here'`
2. **Test the script**: Run the `testAppendRow` function to ensure it works
3. **Review permissions**: Grant necessary permissions when prompted

### 4. Deploy as Web App

1. Click **"Deploy"** → **"New deployment"**
2. Choose type: **"Web app"**
3. Configure:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone (this allows your frontend to call it)
4. Click **"Deploy"**
5. **Copy the Web App URL** - you'll need this for your frontend

### 5. Update Frontend Environment

1. Copy the Web App URL from step 4
2. Create a `.env` file in your frontend directory:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   VITE_GOOGLE_SHEETS_ID=your-google-sheets-id
   ```

### 6. Set Up Google Sheets

Create a Google Sheet with these columns in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Date | Job # | Customer | Claim # | Insurance | Year | Make | Model | VIN | Parts (Est) | Labor | Paint Supplies | Misc | Other | Subtotal | Sales Tax | Insurance Pay | Estimate Profit | Actual Parts Cost | Actual Profit | PDF Link | Status |

Add these formulas in row 2:
- **R2**: `=Q2 - (J2 + L2 + M2 + N2)` (Estimate Profit)
- **T2**: `=IF(S2="", "", Q2 - (S2 + L2 + M2 + N2))` (Actual Profit)

Copy these formulas down as needed.

## Security Notes

- The Apps Script runs under your Google account
- The Web App URL is public but only accepts POST requests with specific data format
- No sensitive credentials are exposed in the frontend
- All data flows through Google's secure infrastructure

## Testing

1. Upload a test PDF in your application
2. Check that a new row appears in your Google Sheet
3. Verify the formulas calculate correctly
4. Check the browser console for any errors

## Troubleshooting

- **Permission errors**: Re-run the deployment and ensure "Anyone" has access
- **Sheet not found**: Verify the sheet name is exactly "Estimates"
- **Formula errors**: Ensure the formulas are in the correct columns (R and T)
- **CORS errors**: Apps Script automatically handles CORS for web apps

This setup provides a secure, serverless way to integrate with Google Sheets without requiring paid Firebase plans or exposing sensitive credentials in your frontend code.
