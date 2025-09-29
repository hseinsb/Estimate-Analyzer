import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Edit3, FileText, PlusCircle } from 'lucide-react';
import { UploadForm } from '../components/UploadForm';
import { ManualEstimateForm } from '../components/ManualEstimateForm';

export function Upload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'upload' | 'manual'>('choose');

  const handleUploadSuccess = (estimateId: string) => {
    // Navigate to the estimates list after successful upload
    navigate('/estimates', { 
      state: { 
        message: 'Estimate saved successfully!',
        estimateId 
      }
    });
  };

  const handleBack = () => {
    setMode('choose');
  };

  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Back to options
            </button>
          </div>
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Back to options
            </button>
          </div>
          <ManualEstimateForm onSuccess={handleUploadSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add New Estimate
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to add your estimate. Upload a CCC One PDF for automatic parsing, 
            or create a manual entry for other estimate types.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* PDF Upload Option */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload PDF
            </h2>
            <p className="text-gray-600 mb-6">
              Upload a CCC One estimate PDF for automatic parsing and data extraction.
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>• Automatic field extraction</li>
              <li>• Supports CCC One format</li>
              <li>• Fast and accurate</li>
            </ul>
            <button
              onClick={() => setMode('upload')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Upload PDF
            </button>
          </div>

          {/* Manual Entry Option */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Edit3 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manual Entry
            </h2>
            <p className="text-gray-600 mb-6">
              Manually enter estimate details for non-CCC One estimates or custom formats.
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>• Full control over data</li>
              <li>• Any estimate format</li>
              <li>• Custom entry fields</li>
            </ul>
            <button
              onClick={() => setMode('manual')}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <PlusCircle className="h-4 w-4 inline mr-2" />
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
