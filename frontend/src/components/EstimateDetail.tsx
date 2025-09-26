import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Car,
  User,
  DollarSign,
  Edit3,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Estimate } from '../types';
import toast from 'react-hot-toast';

interface EstimateDetailProps {
  estimate: Estimate;
}

export function EstimateDetail({ estimate }: EstimateDetailProps) {
  const navigate = useNavigate();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(estimate.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [fileName, setFileName] = useState(estimate.fileName || '');
  const [isSavingFileName, setIsSavingFileName] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const estimateRef = doc(db, 'estimates', estimate.id);
      await updateDoc(estimateRef, {
        notes: notes.trim() || null,
        updatedAt: new Date()
      });
      
      toast.success('Notes saved successfully!');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNotes(estimate.notes || '');
    setIsEditingNotes(false);
  };

  const handleSaveFileName = async () => {
    setIsSavingFileName(true);
    try {
      const estimateRef = doc(db, 'estimates', estimate.id);
      await updateDoc(estimateRef, {
        fileName: fileName.trim() || null,
        updatedAt: new Date()
      });
      
      toast.success('Filename updated successfully!');
      setIsEditingFileName(false);
    } catch (error) {
      console.error('Error updating filename:', error);
      toast.error('Failed to update filename. Please try again.');
    } finally {
      setIsSavingFileName(false);
    }
  };

  const handleCancelFileNameEdit = () => {
    setFileName(estimate.fileName || '');
    setIsEditingFileName(false);
  };

  const handleDeleteEstimate = async () => {
    setIsDeleting(true);
    try {
      const estimateRef = doc(db, 'estimates', estimate.id);
      await deleteDoc(estimateRef);
      
      toast.success('Estimate deleted successfully!');
      navigate('/estimates');
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast.error('Failed to delete estimate. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'Successfully Parsed';
      case 'needs_review':
        return 'Needs Review';
      case 'error':
        return 'Processing Error';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openGoogleSheetsRow = () => {
    // This would need the actual Google Sheets URL and row number
    // For now, just open the main sheet
    const sheetsUrl = `https://docs.google.com/spreadsheets/d/${process.env.REACT_APP_GOOGLE_SHEETS_ID}/edit`;
    window.open(sheetsUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Estimate Details
            </h1>
            <p className="text-gray-600">
              Uploaded on {format(estimate.createdAt, 'MMMM dd, yyyy \'at\' h:mm a')}
            </p>
          </div>
          <div className={`flex items-center px-3 py-2 rounded-md border ${getStatusColor(estimate.status)}`}>
            {getStatusIcon(estimate.status)}
            <span className="ml-2 font-medium">{getStatusText(estimate.status)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={openGoogleSheetsRow}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Google Sheets
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Estimate
          </button>
          {estimate.fileName && (
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md">
              <FileText className="h-4 w-4 mr-2" />
              {isEditingFileName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter filename..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveFileName();
                      } else if (e.key === 'Escape') {
                        handleCancelFileNameEdit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveFileName}
                    disabled={isSavingFileName}
                    className="inline-flex items-center p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                    title="Save filename"
                  >
                    {isSavingFileName ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelFileNameEdit}
                    disabled={isSavingFileName}
                    className="inline-flex items-center p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    title="Cancel editing"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>File: {estimate.fileName}</span>
                  <button
                    onClick={() => setIsEditingFileName(true)}
                    className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800"
                    title="Edit filename"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <p className="mt-1 text-gray-900">{estimate.customerName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Claim Number</label>
              <p className="mt-1 text-gray-900">{estimate.claimNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Company</label>
              <p className="mt-1 text-gray-900">{estimate.insuranceCompany}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Number</label>
              <p className="mt-1 text-gray-900">{estimate.jobNumber || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Vehicle Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <p className="mt-1 text-gray-900">{estimate.vehicle.year || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Make</label>
              <p className="mt-1 text-gray-900">{estimate.vehicle.make || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <p className="mt-1 text-gray-900">{estimate.vehicle.model || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">VIN</label>
              <p className="mt-1 text-gray-900 font-mono text-sm">
                {estimate.vehicle.vin || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Breakdown
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estimate Totals */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              Estimate Totals
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Parts:</span>
                <span className="font-medium">${estimate.totals.parts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor:</span>
                <span className="font-medium">${estimate.totals.labor.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paint Supplies:</span>
                <span className="font-medium">${estimate.totals.paintSupplies.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Miscellaneous:</span>
                <span className="font-medium">${estimate.totals.misc.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Other Charges:</span>
                <span className="font-medium">${estimate.totals.otherCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${estimate.totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sales Tax:</span>
                <span className="font-medium">${estimate.totals.salesTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold">
                <span className="text-gray-900">Grand Total:</span>
                <span className="text-gray-900">${estimate.totals.grandTotal.toLocaleString()}</span>
              </div>
              {estimate.totals.customerPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Pay (Deductible):</span>
                  <span className="font-medium text-orange-600">${estimate.totals.customerPay.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-lg">
                <span className="text-gray-900">Insurance Pay:</span>
                <span className="text-gray-900">${estimate.totals.insurancePay.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              Profit Analysis
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimate Profit:</span>
                <span className={`font-medium ${estimate.profits.estimateProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${estimate.profits.estimateProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Parts Cost:</span>
                <span className="font-medium">
                  {estimate.profits.actualPartsCost !== null 
                    ? `$${estimate.profits.actualPartsCost.toLocaleString()}`
                    : 'Not entered'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Profit:</span>
                <span className={`font-medium ${
                  estimate.profits.actualProfit !== null
                    ? estimate.profits.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    : 'text-gray-400'
                }`}>
                  {estimate.profits.actualProfit !== null 
                    ? `$${estimate.profits.actualProfit.toLocaleString()}`
                    : 'Not calculated'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Processing Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              Processing Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">
                  {Math.round(estimate.parseConfidence * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {format(estimate.createdAt, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {format(estimate.updatedAt, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Notice */}
      {estimate.status === 'needs_review' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>This estimate needs review.</strong> Some fields may not have been parsed correctly or confidence is below the threshold. 
                Please verify the extracted data against the original PDF and update the Google Sheet if necessary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {estimate.status === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Processing Error.</strong> There was an error processing this estimate. 
                Please try re-uploading the PDF or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit3 className="h-5 w-5 mr-2" />
            Notes
          </h2>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this estimate..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-vertical"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {estimate.notes ? (
              <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-4">
                {estimate.notes}
              </div>
            ) : (
              <div className="text-gray-500 italic text-center py-8">
                No notes added yet. Click "Edit" to add notes for this estimate.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Estimate</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this estimate? This action cannot be undone.
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Customer: {estimate.customerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Claim: {estimate.claimNumber}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3 space-x-4 flex justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEstimate}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
