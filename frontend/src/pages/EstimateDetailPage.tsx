import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEstimate } from '../hooks/useEstimates';
import { EstimateDetail } from '../components/EstimateDetail';

export function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { estimate, loading, error } = useEstimate(id!);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading estimate...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Estimate not found</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error || 'The estimate you are looking for does not exist.'}
                </p>
                <div className="mt-4">
                  <Link
                    to="/estimates"
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    ← Back to all estimates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/estimates"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to all estimates
          </Link>
        </div>

        <EstimateDetail estimate={estimate} />
      </div>
    </div>
  );
}
