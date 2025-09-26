# 🔧 Updated Google Apps Script - CORS Fixed

## Replace your entire Apps Script code with this:

```javascript
// Google Apps Script Web App for Estimate Analyzer
// CORS-enabled version for production deployment

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    console.log('Request received:', e);
    
    let data;
    
    // Handle POST requests (JSON data)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        console.log('POST data parsed:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return createResponse({ success: false, error: 'Invalid JSON data' });
      }
    }
    // Handle GET requests (URL parameters for JSONP fallback)
    else if (e.parameter) {
      data = {
        action: e.parameter.action,
        callback: e.parameter.callback,
        data: {
          date: e.parameter.date,
          jobNumber: e.parameter.jobNumber,
          customerName: e.parameter.customerName,
          claimNumber: e.parameter.claimNumber,
          insuranceCompany: e.parameter.insuranceCompany,
          year: e.parameter.year,
          make: e.parameter.make,
          model: e.parameter.model,
          vin: e.parameter.vin,
          parts: parseFloat(e.parameter.parts) || 0,
          bodyLabor: parseFloat(e.parameter.bodyLabor) || 0,
          paintLabor: parseFloat(e.parameter.paintLabor) || 0,
          mechanicalLabor: parseFloat(e.parameter.mechanicalLabor) || 0,
          frameLabor: parseFloat(e.parameter.frameLabor) || 0,
          totalLabor: parseFloat(e.parameter.totalLabor) || 0,
          paintSupplies: parseFloat(e.parameter.paintSupplies) || 0,
          miscellaneous: parseFloat(e.parameter.miscellaneous) || 0,
          otherCharges: parseFloat(e.parameter.otherCharges) || 0,
          subtotal: parseFloat(e.parameter.subtotal) || 0,
          salesTax: parseFloat(e.parameter.salesTax) || 0,
          grandTotal: parseFloat(e.parameter.grandTotal) || 0,
          customerPay: parseFloat(e.parameter.customerPay) || 0,
          insurancePay: parseFloat(e.parameter.insurancePay) || 0,
          firestoreId: e.parameter.firestoreId,
          status: e.parameter.status || 'Parsed'
        }
      };
      console.log('GET data parsed:', data);
    } else {
      console.error('No data received');
      return createResponse({ success: false, error: 'No data received' });
    }

    if (data.action === 'appendRow') {
      const result = appendRowToSheet(data.data);
      
      // Handle JSONP callback for GET requests
      if (data.callback) {
        const callbackResponse = data.callback + '(' + JSON.stringify(result) + ');';
        return HtmlService.createHtmlOutput(callbackResponse)
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
      
      return createResponse(result);
    } else {
      console.error('Unknown action:', data.action);
      return createResponse({ success: false, error: 'Unknown action: ' + data.action });
    }
    
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createResponse({ success: false, error: error.toString() });
  }
}

function createResponse(data) {
  const response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    
  // CRITICAL: CORS Headers for production
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  });
  
  return response;
}

function appendRowToSheet(data) {
  try {
    // Your Google Sheets ID
    const SHEET_ID = '15GZo2vbLxKyp1LZjge4fI_zVpzAuf8ePZxiW5EvSTuw';
    
    console.log('Opening sheet with ID:', SHEET_ID);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Prepare row data to match your sheet structure
    const rowData = [
      data.date,                    // A: Date
      data.jobNumber,               // B: Job #
      data.customerName,            // C: Customer
      data.claimNumber,             // D: Claim #
      data.insuranceCompany,        // E: Insurance
      data.year,                    // F: Year
      data.make,                    // G: Make
      data.model,                   // H: Model
      data.vin,                     // I: VIN
      data.parts,                   // J: Parts (Est)
      data.bodyLabor,               // K: Body Labor
      data.paintLabor,              // L: Paint Labor
      data.mechanicalLabor,         // M: Mechanical Labor
      data.frameLabor,              // N: Frame Labor
      data.totalLabor,              // O: Total Labor
      data.paintSupplies,           // P: Paint Supplies
      data.miscellaneous,           // Q: Miscellaneous
      data.otherCharges,            // R: Other Charges
      data.subtotal,                // S: Subtotal
      data.salesTax,                // T: Sales Tax
      data.grandTotal,              // U: Grand Total
      data.customerPay,             // V: Customer Pay (Deductible)
      data.insurancePay,            // W: Insurance Pay
      data.firestoreId,             // X: Firestore ID
      data.status                   // Y: Status
    ];
    
    console.log('Appending row data:', rowData);
    sheet.appendRow(rowData);
    
    console.log('Row appended successfully');
    return { 
      success: true, 
      message: 'Data appended to Google Sheets successfully',
      rowData: rowData.length + ' fields'
    };
    
  } catch (error) {
    console.error('Error appending to sheet:', error);
    return { 
      success: false, 
      error: 'Failed to append to Google Sheets: ' + error.toString() 
    };
  }
}

// Handle OPTIONS preflight requests
function doOptions(e) {
  return createResponse({ success: true, message: 'CORS preflight handled' });
}
```

## ⚠️ CRITICAL DEPLOYMENT STEPS:

### 1. **Replace Code Completely**
- Select ALL existing code in your Apps Script editor
- DELETE everything
- PASTE the new code above

### 2. **Deploy as NEW Version**
- Click **Deploy** → **New Deployment** 
- **Type**: Web app
- **Execute as**: Me
- **Who has access**: Anyone
- **Click Deploy**

### 3. **Copy the NEW URL**
- Copy the new Web app URL (it will be different!)
- It should look like: `https://script.google.com/macros/s/NEW_SCRIPT_ID/exec`

### 4. **Update Vercel Environment Variables**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Find `VITE_APPS_SCRIPT_URL`
- **Replace** with your NEW Apps Script URL
- **Redeploy** your Vercel app

## 🎯 Expected Result:
- ✅ CORS headers properly configured
- ✅ Both POST and GET requests supported  
- ✅ JSONP fallback working
- ✅ Google Sheets integration functional
- ✅ No more CORS errors!
