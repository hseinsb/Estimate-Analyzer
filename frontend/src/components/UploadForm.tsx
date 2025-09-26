import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parsePDF, calculateEstimateProfit, calculateConfidence, determineStatus } from '../lib/pdfParser';
import toast from 'react-hot-toast';

interface UploadFormProps {
  onUploadSuccess?: (estimateId: string) => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [jobNumber, setJobNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handlePDFUpload = async (file: File) => {
    if (!user) {
      toast.error('You must be signed in to upload files');
      return;
    }

    setProcessing(true);
    const processingToast = toast.loading('Parsing PDF...');

    try {
      // Parse PDF in the browser
      const extractedData = await parsePDF(file);
      
      // Debug: Log the extracted data
      console.log('🔍 Extracted Data:', extractedData);

      // Add job number and notes if provided
      if (jobNumber) {
        extractedData.jobNumber = jobNumber;
      }

      // Calculate confidence and status
      const confidence = calculateConfidence(extractedData);
      const status = determineStatus(extractedData);
      const estimateProfit = calculateEstimateProfit(extractedData.totals);
      
      // Debug: Log calculations
      console.log('📊 Confidence:', confidence);
      console.log('📊 Status:', status);
      console.log('📊 Estimate Profit:', estimateProfit);

      // Create estimate document for Firestore
      const estimateDoc = {
        jobNumber: extractedData.jobNumber,
        customerName: extractedData.customer,
        claimNumber: extractedData.claimNumber,
        insuranceCompany: extractedData.insuranceCompany,
        vehicle: extractedData.vehicle,
        totals: {
          // Map new structure to old structure for compatibility
          parts: extractedData.totals.parts,
          labor: extractedData.totals.totalLabor, // Use the summed total labor
          paintSupplies: extractedData.totals.paintSupplies,
          misc: extractedData.totals.miscellaneous,
          otherCharges: extractedData.totals.otherCharges,
          subtotal: extractedData.totals.subtotal,
          salesTax: extractedData.totals.salesTax,
          grandTotal: extractedData.totals.grandTotal,
          customerPay: extractedData.totals.customerPay, // Deductible
          insurancePay: extractedData.totals.insurancePay
        },
        profits: {
          estimateProfit,
          actualPartsCost: null,
          actualProfit: null
        },
        pdfUrl: null, // No storage on Spark plan
        parseConfidence: confidence,
        status,
        notes: notes || null,
        fileName: file.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid
      };

      // Save to Firestore
      try {
        const docRef = await addDoc(collection(db, 'estimates'), estimateDoc);
        const estimateId = docRef.id;
        console.log('✅ Successfully saved to Firestore:', estimateId);

        toast.success('PDF parsed and saved successfully! Data will sync to Google Sheets automatically.', { id: processingToast });

        // Reset form
        setJobNumber('');
        setNotes('');
        
        if (onUploadSuccess) {
          onUploadSuccess(estimateId);
        }

      } catch (firestoreError: any) {
        console.error('Firestore error:', firestoreError);
        
        // Show detailed error information
        let errorMessage = 'Failed to save to database. ';
        if (firestoreError.code === 'permission-denied') {
          errorMessage += 'Permission denied. Please check Firestore rules.';
        } else if (firestoreError.code === 'unauthenticated') {
          errorMessage += 'Not authenticated. Please sign in.';
        } else {
          errorMessage += `Error: ${firestoreError.message}`;
        }
        
        toast.error(errorMessage, { id: processingToast });
        
        // Still show the parsed data even if Firestore fails
        console.log('Parsed data (not saved):', extractedData);
      }

    } catch (error) {
      console.error('PDF processing error:', error);
      toast.error('Failed to parse PDF. Please ensure it\'s a valid CCC One estimate.', {
        id: processingToast
      });
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        handlePDFUpload(file);
      } else {
        toast.error('Please upload a PDF file only');
      }
    }
  }, [jobNumber, notes, user]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: processing
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Upload CCC One Estimate
        </h1>

        {/* Optional Fields */}
        <div className="space-y-6 mb-8">
          <div>
            <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Job Number (RO) - Optional
            </label>
            <input
              type="text"
              id="jobNumber"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter job or repair order number"
              disabled={processing}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes - Optional
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add any additional notes"
              disabled={processing}
            />
          </div>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive && !isDragReject ? 'border-primary-500 bg-primary-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
            ${processing ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-gray-600">Parsing PDF and extracting data...</p>
              </>
            ) : (
              <>
                {isDragReject ? (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="text-red-600">Only PDF files are allowed</p>
                  </>
                ) : (
                  <>
                    {isDragActive ? (
                      <>
                        <Upload className="h-12 w-12 text-primary-500 mx-auto" />
                        <p className="text-primary-600">Drop your PDF here</p>
                      </>
                    ) : (
                      <>
                        <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="text-gray-600">
                          Drag and drop your CCC One estimate PDF here, or{' '}
                          <span className="text-primary-600 underline">click to browse</span>
                        </p>
                        <p className="text-sm text-gray-500">PDF files only</p>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Automated Processing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>PDF is parsed directly in your browser (no upload required)</li>
                <li>Extracted data is saved to Firestore database instantly</li>
                <li>Data automatically syncs to Google Sheets every 5 minutes</li>
                <li>Processing typically takes 5-10 seconds</li>
                <li>PDF files are not stored - only the extracted data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}