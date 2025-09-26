# 🔧 **Google Apps Script CORS Fix**

## ✅ **Current Status:**
- ✅ **PDF Parsing**: Working perfectly
- ✅ **Firestore**: Working perfectly (saved document: RgHLuSFGY8R7DR4imoM1)
- ❌ **Google Sheets**: CORS error blocking requests

## 🚀 **Solution: Update Apps Script Code**

### **Step 1: Open Your Apps Script Project**
1. Go to [Google Apps Script](https://script.google.com)
2. Find your project with ID: `AKfycbyQvtE4oKwh_GhkDDPhJFjJhQbE7DaTr8HjxQhs-dqadcYs18EcEBNl4M6b0ExRGMNrKw`
3. Click to open it

### **Step 2: Replace the Code**
Replace the existing code with this **CORS-enabled version**:

```javascript
function doPost(e) {
  try {
    // Handle CORS preflight request
    if (e.parameter && e.parameter.method === 'OPTIONS') {
      return ContentService
        .createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }

    // Parse the request body
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    if (data.action === 'appendRow') {
      const result = appendRowToSheet(data.data);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function appendRowToSheet(data) {
  try {
    // Replace with your actual Google Sheets ID
    const SHEET_ID = '15GZo2vbLxKyp1LZjge4fI_zVpzAuf8ePZxiW5EvSTuw'; // Your Sheet ID
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
    
    return {success: true};
    
  } catch (error) {
    Logger.log('Sheet append error: ' + error.toString());
    return {success: false, error: error.toString()};
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
  Logger.log(JSON.stringify(result));
}
```

### **Step 3: Save and Redeploy**
1. **Save** the script (Ctrl+S)
2. **Deploy** → **Manage deployments**
3. **Edit** the existing deployment
4. **Update** the deployment (same settings)
5. **Deploy** again

### **Step 4: Test the Fix**
```bash
# Test the Apps Script
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

## 🎯 **Expected Results:**

### **After Fix:**
- ✅ **No CORS errors** in browser console
- ✅ **PDF upload** works completely
- ✅ **Data saved** to Firestore
- ✅ **Row appended** to Google Sheets
- ✅ **Success messages** displayed

## 🎉 **Current Progress:**

| Component | Status | Notes |
|-----------|--------|-------|
| **PDF.js** | ✅ Complete | Worker loaded locally |
| **PDF Parsing** | ✅ Complete | No parsing errors |
| **Authentication** | ✅ Complete | User can sign in |
| **Firestore** | ✅ Complete | Rules deployed, saving data |
| **Google Sheets** | 🔧 Fixing | CORS issue to resolve |

## 🚀 **You're 99% Complete!**

**Just update the Apps Script code above and redeploy!** 

**After that, your Estimate Analyzer will be fully functional!** 🎉
