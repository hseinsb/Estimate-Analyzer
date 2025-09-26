# 🔄 Firestore → Google Sheets Sync Script

## 📋 **Step-by-Step Setup:**

### **1. Create New Google Apps Script**
1. Go to [script.google.com](https://script.google.com)
2. **New Project**
3. **Replace all code** with the script below
4. **Save** as "Firestore Sheets Sync"

### **2. Complete Apps Script Code:**

```javascript
/**
 * Firestore to Google Sheets Sync
 * Runs every 5 minutes to sync new estimates from Firestore to Google Sheets
 */

function syncFirestoreToSheets() {
  try {
    console.log('🔄 Starting Firestore → Sheets sync...');
    
    // Configuration
    const SHEET_ID = '15GZo2vbLxKyp1LZjge4fI_zVpzAuf8ePZxiW5EvSTuw';
    const PROJECT_ID = 'estimate-analyzer-ca4c6';
    const COLLECTION = 'estimates';
    
    // Open Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Get existing Firestore IDs from sheet (Column AA = index 26)
    const existingData = sheet.getDataRange().getValues();
    let existingIds = [];
    
    if (existingData.length > 1) {
      existingIds = existingData.slice(1).map(row => row[26] || '').filter(id => id !== '');
    }
    
    console.log(`📊 Found ${existingIds.length} existing records in sheet`);
    
    // Fetch documents from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;
    
    console.log('🔍 Fetching documents from Firestore...');
    const response = UrlFetchApp.fetch(firestoreUrl);
    const firestoreData = JSON.parse(response.getContentText());
    
    if (!firestoreData.documents) {
      console.log('📭 No documents found in Firestore');
      return 'No documents found';
    }
    
    console.log(`📄 Found ${firestoreData.documents.length} documents in Firestore`);
    
    let newRowsAdded = 0;
    
    // Process each document
    firestoreData.documents.forEach(doc => {
      try {
        // Extract document ID from path
        const docId = doc.name.split('/').pop();
        
        // Skip if already exists in sheet
        if (existingIds.includes(docId)) {
          console.log(`⏭️  Skipping existing document: ${docId}`);
          return;
        }
        
        console.log(`✨ Processing new document: ${docId}`);
        
        const fields = doc.fields || {};
        
        // Helper function to safely extract values
        const getValue = (path) => {
          const keys = path.split('.');
          let current = fields;
          
          for (const key of keys) {
            if (!current || !current[key]) return null;
            current = current[key];
          }
          
          return current;
        };
        
        // Extract date from createdAt timestamp
        const createdAt = getValue('createdAt.timestampValue');
        const date = createdAt ? createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
        
        // Extract vehicle data
        const vehicleYear = getValue('vehicle.mapValue.fields.year.stringValue') || 
                           getValue('vehicle.mapValue.fields.year.integerValue') || '';
        const vehicleMake = getValue('vehicle.mapValue.fields.make.stringValue') || '';
        const vehicleModel = getValue('vehicle.mapValue.fields.model.stringValue') || '';
        const vehicleVin = getValue('vehicle.mapValue.fields.vin.stringValue') || '';
        
        // Extract totals data
        const totalsMap = getValue('totals.mapValue.fields') || {};
        const getTotal = (field) => {
          return parseFloat(totalsMap[field]?.doubleValue || totalsMap[field]?.integerValue || 0);
        };
        
        // Extract profits data
        const profitsMap = getValue('profits.mapValue.fields') || {};
        const estimateProfit = parseFloat(profitsMap.estimateProfit?.doubleValue || profitsMap.estimateProfit?.integerValue || 0);
        
        // Build row data matching your sheet structure (A through BB)
        const rowData = [
          date,                                                           // A: Date
          getValue('jobNumber.stringValue') || '',                       // B: Job #
          getValue('customerName.stringValue') || '',                    // C: Customer
          getValue('claimNumber.stringValue') || '',                     // D: Claim #
          getValue('insuranceCompany.stringValue') || '',                // E: Insurance
          vehicleYear,                                                   // F: Year
          vehicleMake,                                                   // G: Make
          vehicleModel,                                                  // H: Model
          vehicleVin,                                                    // I: VIN
          getTotal('parts'),                                             // J: Parts
          getTotal('bodyLabor'),                                         // K: Body Labor
          getTotal('paintLabor'),                                        // L: Paint Labor
          getTotal('mechanicalLabor'),                                   // M: Mechanical Labor
          getTotal('frameLabor'),                                        // N: Frame Labor
          getTotal('totalLabor'),                                        // O: Total Labor
          getTotal('paintSupplies'),                                     // P: Paint Supplies
          getTotal('miscellaneous'),                                     // Q: Miscellaneous
          getTotal('otherCharges'),                                      // R: Other Charges
          getTotal('subtotal'),                                          // S: Subtotal
          getTotal('salesTax'),                                          // T: Sales Tax
          getTotal('grandTotal'),                                        // U: Grand Total
          getTotal('customerPay'),                                       // V: Customer Pay (Deductible)
          getTotal('insurancePay'),                                      // W: Insurance Pay
          estimateProfit,                                                // X: Estimate Profit
          '',                                                            // Y: Actual Parts Cost (manual)
          '',                                                            // Z: Actual Profit (formula)
          docId,                                                         // AA: Firestore ID
          getValue('status.stringValue') || 'Parsed'                     // BB: Status
        ];
        
        // Append row to sheet
        sheet.appendRow(rowData);
        newRowsAdded++;
        
        console.log(`✅ Added row for ${getValue('customerName.stringValue') || 'Unknown'} - ${getValue('claimNumber.stringValue') || 'No Claim'}`);
        
      } catch (docError) {
        console.error(`❌ Error processing document ${doc.name}:`, docError);
      }
    });
    
    const result = `✅ Sync completed! Added ${newRowsAdded} new estimates to Google Sheets.`;
    console.log(result);
    return result;
    
  } catch (error) {
    const errorMsg = `❌ Sync failed: ${error.toString()}`;
    console.error(errorMsg);
    return errorMsg;
  }
}

/**
 * Set up automatic sync trigger (run this function ONCE)
 */
function setupAutomaticSync() {
  try {
    // Delete existing triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncFirestoreToSheets') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger to run every 5 minutes
    ScriptApp.newTrigger('syncFirestoreToSheets')
      .timeBased()
      .everyMinutes(5)
      .create();
    
    console.log('⏰ Automatic sync trigger created! Will run every 5 minutes.');
    return 'Automatic sync enabled - runs every 5 minutes';
    
  } catch (error) {
    console.error('Failed to create trigger:', error);
    return 'Failed to setup automatic sync: ' + error.toString();
  }
}

/**
 * Test function to manually run sync once
 */
function testSync() {
  console.log('🧪 Running manual test sync...');
  return syncFirestoreToSheets();
}

/**
 * Disable automatic sync
 */
function disableAutomaticSync() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncFirestoreToSheets') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });
    
    console.log(`🛑 Deleted ${deletedCount} sync triggers`);
    return `Automatic sync disabled (${deletedCount} triggers removed)`;
    
  } catch (error) {
    console.error('Failed to disable triggers:', error);
    return 'Failed to disable sync: ' + error.toString();
  }
}
```

### **3. Setup Instructions:**

#### **A. Initial Test:**
1. Click **Run** → Select `testSync` 
2. **Authorize** when prompted (Google will ask for permissions)
3. Check Google Sheets - should see existing Firestore data appear

#### **B. Enable Automatic Sync:**
1. Click **Run** → Select `setupAutomaticSync`
2. This creates a trigger to run every 5 minutes
3. Your data will now sync automatically!

#### **C. Monitor Sync:**
- **View logs**: Click **Executions** in Apps Script to see sync results
- **Check sheet**: New estimates should appear within 5 minutes
- **Manual sync**: Run `testSync` anytime for immediate sync

### **4. How It Works:**

```
User uploads PDF → Frontend saves to Firestore ✅
                          ↓
Every 5 minutes → Apps Script checks Firestore for new records
                          ↓
Apps Script finds new estimates → Writes to Google Sheets
                          ↓
Google Sheets updated automatically! 🎉
```

### **5. Benefits:**

✅ **No CORS issues** - Apps Script runs server-side  
✅ **Automatic** - Works 24/7 without intervention  
✅ **Reliable** - Google's infrastructure  
✅ **No frontend changes** - Your React app stays the same  
✅ **Duplicate prevention** - Won't add same estimate twice  
✅ **Error handling** - Continues working even if one record fails  

### **6. Troubleshooting:**

- **No data syncing?** Run `testSync` manually and check logs
- **Permission errors?** Re-authorize the script
- **Want to stop?** Run `disableAutomaticSync`
- **Need immediate sync?** Run `testSync` anytime

This solution completely bypasses CORS and gives you reliable, automatic syncing! 🚀
