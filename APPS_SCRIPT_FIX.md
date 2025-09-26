# Google Apps Script Configuration Fix

## Issue: "Access Denied" Error

The Apps Script is currently returning an "Access Denied" error because it needs to be properly configured for public access.

## Solution: Configure Apps Script Deployment

### Step 1: Open Your Apps Script Project
1. Go to [Google Apps Script](https://script.google.com)
2. Find your project with ID: `AKfycbyQvtE4oKwh_GhkDDPhJFjJhQbE7DaTr8HjxQhs-dqadcYs18EcEBNl4M6b0ExRGMNrKw`
3. Click to open it

### Step 2: Update the Script Code
Replace the existing code with this complete version:

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
    // Replace with your actual Google Sheets ID
    const SHEET_ID = 'your-google-sheets-id-here'; // UPDATE THIS!
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

### Step 3: Update Sheet ID
1. **Find your Google Sheets ID** in the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
2. **Replace** `'your-google-sheets-id-here'` with your actual Sheet ID
3. **Save** the script (Ctrl+S)

### Step 4: Test the Script
1. **Run** the `testAppendRow` function
2. **Check** the execution log for any errors
3. **Verify** a test row was added to your Google Sheet

### Step 5: Redeploy as Web App
1. Click **"Deploy"** → **"Manage deployments"**
2. Click the **pencil icon** to edit the existing deployment
3. **Update** the deployment:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
4. Click **"Deploy"**
5. **Copy the new Web App URL** (it should be the same)

### Step 6: Test the Web App
Run this command to test:

```bash
curl -X POST "https://script.google.com/macros/s/AKfycbyQvtE4oKwh_GhkDDPhJFjJhQbE7DaTr8HjxQhs-dqadcYs18EcEBNl4M6b0ExRGMNrKw/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "appendRow",
    "data": {
      "customerName": "Test Customer",
      "claimNumber": "TEST123",
      "insuranceCompany": "Test Insurance",
      "parts": 1000,
      "labor": 500,
      "insurancePay": 1500,
      "status": "Parsed"
    }
  }'
```

### Expected Response
You should get a JSON response like:
```json
{"success": true}
```

## Troubleshooting

### If you still get "Access Denied":
1. **Check deployment settings**: Ensure "Who has access" is set to "Anyone"
2. **Verify script permissions**: Make sure the script has access to your Google Sheet
3. **Check sheet sharing**: Ensure your Google account has access to the sheet

### If you get "Sheet not found":
1. **Verify sheet name**: Make sure your sheet has a tab named exactly "Estimates"
2. **Check sheet ID**: Double-check the Sheet ID in the script
3. **Test permissions**: Try opening the sheet in your browser

### If you get execution errors:
1. **Check Apps Script logs**: Go to Executions tab in Apps Script
2. **Verify sheet structure**: Ensure columns A-V exist
3. **Test with simple data**: Try with minimal data first

## Next Steps

Once the Apps Script is working:
1. **Update your frontend** `.env` file with the correct Google Sheets ID
2. **Test PDF upload** in your application
3. **Verify data** appears in both Firestore and Google Sheets

The Apps Script should now work correctly with your frontend application!
