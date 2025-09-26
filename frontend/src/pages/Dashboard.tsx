import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useEstimates } from '../hooks/useEstimates';
import { format } from 'date-fns';

export function Dashboard() {
  const { estimates, loading } = useEstimates();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = estimates.length;
    const parsed = estimates.filter(e => e.status === 'parsed').length;
    const needsReview = estimates.filter(e => e.status === 'needs_review').length;
    const errors = estimates.filter(e => e.status === 'error').length;
    const totalValue = estimates.reduce((sum, e) => sum + e.totals.insurancePay, 0);
    const totalProfit = estimates.reduce((sum, e) => sum + e.profits.estimateProfit, 0);

    return {
      total,
      parsed,
      needsReview,
      errors,
      totalValue,
      totalProfit
    };
  }, [estimates]);

  // Recent estimates (last 5)
  const recentEstimates = estimates.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your CCC One estimate processing
          </p>
          
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Estimates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Successfully Parsed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.parsed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Needs Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.needsReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.totalValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Estimates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Estimates</h2>
                  <Link
                    to="/estimates"
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentEstimates.length > 0 ? (
                  recentEstimates.map((estimate) => (
                    <Link key={estimate.id} to={`/estimates/${estimate.id}`} className="block">
                      <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {estimate.status === 'parsed' && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                                {estimate.status === 'needs_review' && (
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                )}
                                {estimate.status === 'error' && (
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {estimate.customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {estimate.insuranceCompany} • Claim: {estimate.claimNumber}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                ${(estimate.totals.insurancePay || 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {estimate.createdAt ? format(estimate.createdAt, 'MMM dd') : 'Unknown'}
                              </p>
                            </div>
                            <span className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                              View
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No estimates yet</p>
                    <Link
                      to="/upload"
                      className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Upload your first estimate
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/upload"
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Estimate
                </Link>
                <Link
                  to="/estimates"
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Estimates
                </Link>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Insurance Pay:</span>
                  <span className="font-medium">${(stats.totalValue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Profit:</span>
                  <span className={`font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(stats.totalProfit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">
                    {stats.total > 0 ? Math.round((stats.parsed / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            {stats.total > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Parsed</span>
                    </div>
                    <span className="text-sm font-medium">{stats.parsed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">Needs Review</span>
                    </div>
                    <span className="text-sm font-medium">{stats.needsReview}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600">Errors</span>
                    </div>
                    <span className="text-sm font-medium">{stats.errors}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
