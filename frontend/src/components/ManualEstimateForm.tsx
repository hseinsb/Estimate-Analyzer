import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Save, Calculator, User, Car, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManualEstimateFormProps {
  onSuccess?: (estimateId: string) => void;
}

export function ManualEstimateForm({ onSuccess }: ManualEstimateFormProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    customerName: '',
    claimNumber: '',
    jobNumber: '',
    insuranceCompany: '',
    
    // Vehicle Information
    vehicle: {
      year: '',
      make: '',
      model: '',
      vin: ''
    },
    
    // Financial Information
    totals: {
      parts: 0,
      bodyLabor: 0,
      paintLabor: 0,
      mechanicalLabor: 0,
      frameLabor: 0,
      paintSupplies: 0,
      miscellaneous: 0,
      otherCharges: 0,
      salesTax: 0,
      customerPay: 0,
      insurancePay: 0
    },
    
    // Notes
    notes: ''
  });

  // Calculate derived values
  const totalLabor = formData.totals.bodyLabor + formData.totals.paintLabor + 
                    formData.totals.mechanicalLabor + formData.totals.frameLabor;
  
  const subtotal = formData.totals.parts + totalLabor + formData.totals.paintSupplies + 
                  formData.totals.miscellaneous + formData.totals.otherCharges;
  
  const grandTotal = subtotal + formData.totals.salesTax;
  const estimateProfit = totalLabor; // Labor only profit

  const handleInputChange = (section: string, field: string, value: string | number) => {
    if (section === 'vehicle') {
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [field]: value
        }
      }));
    } else if (section === 'totals') {
      setFormData(prev => ({
        ...prev,
        totals: {
          ...prev.totals,
          [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be signed in to create estimates');
      return;
    }

    // Validation
    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!formData.claimNumber.trim()) {
      toast.error('Claim number is required');
      return;
    }

    setSaving(true);
    const savingToast = toast.loading('Saving estimate...');

    try {
      // Create estimate document
      const estimateDoc = {
        customerName: formData.customerName.trim(),
        claimNumber: formData.claimNumber.trim(),
        jobNumber: formData.jobNumber.trim() || null,
        insuranceCompany: formData.insuranceCompany.trim(),
        vehicle: {
          year: formData.vehicle.year ? parseInt(formData.vehicle.year) : null,
          make: formData.vehicle.make.trim() || null,
          model: formData.vehicle.model.trim() || null,
          vin: formData.vehicle.vin.trim() || null
        },
        totals: {
          parts: formData.totals.parts,
          bodyLabor: formData.totals.bodyLabor,
          paintLabor: formData.totals.paintLabor,
          mechanicalLabor: formData.totals.mechanicalLabor,
          frameLabor: formData.totals.frameLabor,
          totalLabor: totalLabor,
          paintSupplies: formData.totals.paintSupplies,
          miscellaneous: formData.totals.miscellaneous,
          otherCharges: formData.totals.otherCharges,
          subtotal: subtotal,
          salesTax: formData.totals.salesTax,
          grandTotal: grandTotal,
          customerPay: formData.totals.customerPay,
          insurancePay: formData.totals.insurancePay
        },
        profits: {
          estimateProfit: estimateProfit,
          actualPartsCost: null,
          actualProfit: null
        },
        pdfUrl: null, // No PDF for manual entries
        parseConfidence: 1.0, // 100% confidence for manual entry
        status: 'parsed',
        notes: formData.notes.trim() || null,
        fileName: null, // No file for manual entries
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'estimates'), estimateDoc);
      
      toast.dismiss(savingToast);
      toast.success('Estimate created successfully!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(docRef.id);
      }
      
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast.dismiss(savingToast);
      toast.error('Failed to save estimate. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Manual Estimate Entry
        </h2>
        <p className="text-gray-600">
          Enter all estimate details manually for non-CCC One estimates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('', 'customerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claim Number *
              </label>
              <input
                type="text"
                value={formData.claimNumber}
                onChange={(e) => handleInputChange('', 'claimNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter claim number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Number
              </label>
              <input
                type="text"
                value={formData.jobNumber}
                onChange={(e) => handleInputChange('', 'jobNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter job number (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Company
              </label>
              <input
                type="text"
                value={formData.insuranceCompany}
                onChange={(e) => handleInputChange('', 'insuranceCompany', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter insurance company"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Vehicle Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                value={formData.vehicle.year}
                onChange={(e) => handleInputChange('vehicle', 'year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2019"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make
              </label>
              <input
                type="text"
                value={formData.vehicle.make}
                onChange={(e) => handleInputChange('vehicle', 'make', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Toyota"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.vehicle.model}
                onChange={(e) => handleInputChange('vehicle', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Camry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN
              </label>
              <input
                type="text"
                value={formData.vehicle.vin}
                onChange={(e) => handleInputChange('vehicle', 'vin', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="Enter VIN"
                maxLength={17}
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Financial Information
          </h3>
          
          {/* Parts and Labor */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.parts}
                onChange={(e) => handleInputChange('totals', 'parts', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Labor ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.bodyLabor}
                onChange={(e) => handleInputChange('totals', 'bodyLabor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paint Labor ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.paintLabor}
                onChange={(e) => handleInputChange('totals', 'paintLabor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mechanical Labor ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.mechanicalLabor}
                onChange={(e) => handleInputChange('totals', 'mechanicalLabor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frame Labor ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.frameLabor}
                onChange={(e) => handleInputChange('totals', 'frameLabor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paint Supplies ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.paintSupplies}
                onChange={(e) => handleInputChange('totals', 'paintSupplies', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miscellaneous ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.miscellaneous}
                onChange={(e) => handleInputChange('totals', 'miscellaneous', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Charges ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.otherCharges}
                onChange={(e) => handleInputChange('totals', 'otherCharges', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sales Tax ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.salesTax}
                onChange={(e) => handleInputChange('totals', 'salesTax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Pay / Deductible ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.customerPay}
                onChange={(e) => handleInputChange('totals', 'customerPay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Pay ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totals.insurancePay}
                onChange={(e) => handleInputChange('totals', 'insurancePay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Calculated Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Calculator className="h-4 w-4 mr-1" />
              Calculated Totals
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Labor:</span>
                <span className="font-medium">${totalLabor.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grand Total:</span>
                <span className="font-medium">${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimate Profit:</span>
                <span className="font-medium text-green-600">${estimateProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('', 'notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes about this estimate..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Estimate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
