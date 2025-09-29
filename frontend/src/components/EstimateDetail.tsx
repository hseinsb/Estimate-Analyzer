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
  
  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(estimate.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filename editing state
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [fileName, setFileName] = useState(estimate.fileName || '');
  const [isSavingFileName, setIsSavingFileName] = useState(false);
  
  // Comprehensive editing state
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingData, setEditingData] = useState({
    customerName: estimate.customerName || '',
    claimNumber: estimate.claimNumber || '',
    jobNumber: estimate.jobNumber || '',
    insuranceCompany: estimate.insuranceCompany || '',
    vehicle: {
      year: estimate.vehicle?.year?.toString() || '',
      make: estimate.vehicle?.make || '',
      model: estimate.vehicle?.model || '',
      vin: estimate.vehicle?.vin || ''
    },
    totals: {
      parts: estimate.totals?.parts || 0,
      bodyLabor: estimate.totals?.bodyLabor || 0,
      paintLabor: estimate.totals?.paintLabor || 0,
      mechanicalLabor: estimate.totals?.mechanicalLabor || 0,
      frameLabor: estimate.totals?.frameLabor || 0,
      totalLabor: estimate.totals?.totalLabor || estimate.totals?.labor || 0,
      paintSupplies: estimate.totals?.paintSupplies || 0,
      miscellaneous: estimate.totals?.miscellaneous || estimate.totals?.misc || 0,
      otherCharges: estimate.totals?.otherCharges || 0,
      subtotal: estimate.totals?.subtotal || 0,
      salesTax: estimate.totals?.salesTax || 0,
      grandTotal: estimate.totals?.grandTotal || 0,
      customerPay: estimate.totals?.customerPay || 0,
      insurancePay: estimate.totals?.insurancePay || 0
    }
  });

  // Calculate totals when editing
  const calculateTotals = (data: any) => {
    const totalLabor = (data.totals.bodyLabor || 0) + 
                      (data.totals.paintLabor || 0) + 
                      (data.totals.mechanicalLabor || 0) + 
                      (data.totals.frameLabor || 0);
    
    const subtotal = (data.totals.parts || 0) + 
                    totalLabor + 
                    (data.totals.paintSupplies || 0) + 
                    (data.totals.miscellaneous || 0) + 
                    (data.totals.otherCharges || 0);
    
    const grandTotal = subtotal + (data.totals.salesTax || 0);
    
    return {
      ...data.totals,
      totalLabor,
      subtotal,
      grandTotal
    };
  };

  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    try {
      const calculatedTotals = calculateTotals(editingData);
      const estimateProfit = calculatedTotals.totalLabor; // Labor only profit
      
      const estimateRef = doc(db, 'estimates', estimate.id);
      await updateDoc(estimateRef, {
        customerName: editingData.customerName.trim(),
        claimNumber: editingData.claimNumber.trim(),
        jobNumber: editingData.jobNumber.trim() || null,
        insuranceCompany: editingData.insuranceCompany.trim(),
        vehicle: {
          year: editingData.vehicle.year ? parseInt(editingData.vehicle.year) : null,
          make: editingData.vehicle.make.trim() || null,
          model: editingData.vehicle.model.trim() || null,
          vin: editingData.vehicle.vin.trim() || null
        },
        totals: calculatedTotals,
        profits: {
          estimateProfit,
          actualPartsCost: estimate.profits?.actualPartsCost || null,
          actualProfit: estimate.profits?.actualProfit || null
        },
        status: 'parsed', // Mark as parsed after manual entry
        updatedAt: new Date()
      });
      
      toast.success('Estimate updated successfully!');
      setIsEditingMode(false);
      
      // No need to reload - the form data is already updated locally
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast.error('Failed to save estimate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original data
    setEditingData({
      customerName: estimate.customerName || '',
      claimNumber: estimate.claimNumber || '',
      jobNumber: estimate.jobNumber || '',
      insuranceCompany: estimate.insuranceCompany || '',
      vehicle: {
        year: estimate.vehicle?.year?.toString() || '',
        make: estimate.vehicle?.make || '',
        model: estimate.vehicle?.model || '',
        vin: estimate.vehicle?.vin || ''
      },
      totals: {
        parts: estimate.totals?.parts || 0,
        bodyLabor: estimate.totals?.bodyLabor || 0,
        paintLabor: estimate.totals?.paintLabor || 0,
        mechanicalLabor: estimate.totals?.mechanicalLabor || 0,
        frameLabor: estimate.totals?.frameLabor || 0,
        totalLabor: estimate.totals?.totalLabor || estimate.totals?.labor || 0,
        paintSupplies: estimate.totals?.paintSupplies || 0,
        miscellaneous: estimate.totals?.miscellaneous || estimate.totals?.misc || 0,
        otherCharges: estimate.totals?.otherCharges || 0,
        subtotal: estimate.totals?.subtotal || 0,
        salesTax: estimate.totals?.salesTax || 0,
        grandTotal: estimate.totals?.grandTotal || 0,
        customerPay: estimate.totals?.customerPay || 0,
        insurancePay: estimate.totals?.insurancePay || 0
      }
    });
    setIsEditingMode(false);
  };

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

  const handleCancelNotesEdit = () => {
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
              Uploaded on {estimate.createdAt ? format(estimate.createdAt, 'MMMM dd, yyyy \'at\' h:mm a') : 'Unknown date'}
            </p>
          </div>
          <div className={`flex items-center px-3 py-2 rounded-md border ${getStatusColor(estimate.status)}`}>
            {getStatusIcon(estimate.status)}
            <span className="ml-2 font-medium">{getStatusText(estimate.status)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {isEditingMode ? (
            <>
              <button
                onClick={handleSaveAllChanges}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditingMode(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Estimate
              </button>
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
            </>
          )}
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
            {isEditingMode && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Editing</span>
            )}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.customerName}
                  onChange={(e) => setEditingData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.customerName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Claim Number</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.claimNumber}
                  onChange={(e) => setEditingData(prev => ({ ...prev, claimNumber: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter claim number"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.claimNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Company</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.insuranceCompany}
                  onChange={(e) => setEditingData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter insurance company"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.insuranceCompany}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Number</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.jobNumber}
                  onChange={(e) => setEditingData(prev => ({ ...prev, jobNumber: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter job number (optional)"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.jobNumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Vehicle Information
            {isEditingMode && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Editing</span>
            )}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.vehicle.year}
                  onChange={(e) => setEditingData(prev => ({ 
                    ...prev, 
                    vehicle: { ...prev.vehicle, year: e.target.value }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2019"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.vehicle.year || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Make</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.vehicle.make}
                  onChange={(e) => setEditingData(prev => ({ 
                    ...prev, 
                    vehicle: { ...prev.vehicle, make: e.target.value }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Toyota"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.vehicle.make || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.vehicle.model}
                  onChange={(e) => setEditingData(prev => ({ 
                    ...prev, 
                    vehicle: { ...prev.vehicle, model: e.target.value }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Camry"
                />
              ) : (
                <p className="mt-1 text-gray-900">{estimate.vehicle.model || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">VIN</label>
              {isEditingMode ? (
                <input
                  type="text"
                  value={editingData.vehicle.vin}
                  onChange={(e) => setEditingData(prev => ({ 
                    ...prev, 
                    vehicle: { ...prev.vehicle, vin: e.target.value.toUpperCase() }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Enter VIN"
                  maxLength={17}
                />
              ) : (
                <p className="mt-1 text-gray-900 font-mono text-sm">
                  {estimate.vehicle.vin || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Breakdown
          {isEditingMode && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Editing</span>
          )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estimate Totals */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              Estimate Totals
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Parts:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.parts}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, parts: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium">${(estimate.totals.parts || 0).toLocaleString()}</span>
                )}
              </div>
              {isEditingMode ? (
                <>
                  {/* Individual Labor Breakdowns in Edit Mode */}
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Labor Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Body Labor:</span>
                        <div className="flex items-center">
                          <span className="mr-1 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.totals.bodyLabor || 0}
                            onChange={(e) => setEditingData(prev => ({ 
                              ...prev, 
                              totals: { ...prev.totals, bodyLabor: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Paint Labor:</span>
                        <div className="flex items-center">
                          <span className="mr-1 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.totals.paintLabor || 0}
                            onChange={(e) => setEditingData(prev => ({ 
                              ...prev, 
                              totals: { ...prev.totals, paintLabor: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Mechanical:</span>
                        <div className="flex items-center">
                          <span className="mr-1 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.totals.mechanicalLabor || 0}
                            onChange={(e) => setEditingData(prev => ({ 
                              ...prev, 
                              totals: { ...prev.totals, mechanicalLabor: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Frame Labor:</span>
                        <div className="flex items-center">
                          <span className="mr-1 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData.totals.frameLabor || 0}
                            onChange={(e) => setEditingData(prev => ({ 
                              ...prev, 
                              totals: { ...prev.totals, frameLabor: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300 font-medium">
                      <span>Total Labor:</span>
                      <span className="text-blue-600">
                        ${((editingData.totals.bodyLabor || 0) + 
                           (editingData.totals.paintLabor || 0) + 
                           (editingData.totals.mechanicalLabor || 0) + 
                           (editingData.totals.frameLabor || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Labor:</span>
                  <span className="font-medium">${(estimate.totals.totalLabor || estimate.totals.labor || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paint Supplies:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.paintSupplies}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, paintSupplies: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium">${(estimate.totals.paintSupplies || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Miscellaneous:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.miscellaneous}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, miscellaneous: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium">${(estimate.totals.miscellaneous || estimate.totals.misc || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Other Charges:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.otherCharges}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, otherCharges: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium">${(estimate.totals.otherCharges || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${(estimate.totals.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sales Tax:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.salesTax}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, salesTax: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium">${(estimate.totals.salesTax || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold">
                <span className="text-gray-900">Grand Total:</span>
                <span className="text-gray-900">${(estimate.totals.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Pay (Deductible):</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.customerPay}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, customerPay: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <span className="font-medium text-orange-600">${(estimate.totals.customerPay || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-3 font-semibold text-lg">
                <span className="text-gray-900">Insurance Pay:</span>
                {isEditingMode ? (
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingData.totals.insurancePay}
                      onChange={(e) => setEditingData(prev => ({ 
                        ...prev, 
                        totals: { ...prev.totals, insurancePay: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-28 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                    />
                  </div>
                ) : (
                  <span className="text-gray-900">${(estimate.totals.insurancePay || 0).toLocaleString()}</span>
                )}
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
                  ${(estimate.profits.estimateProfit || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Parts Cost:</span>
                <span className="font-medium">
                  {estimate.profits.actualPartsCost !== null 
                    ? `$${(estimate.profits.actualPartsCost || 0).toLocaleString()}`
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
                    ? `$${(estimate.profits.actualProfit || 0).toLocaleString()}`
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
                  {estimate.createdAt ? format(estimate.createdAt, 'MMM dd, yyyy') : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {estimate.updatedAt ? format(estimate.updatedAt, 'MMM dd, yyyy') : 'Unknown'}
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
                onClick={handleCancelNotesEdit}
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
