import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEstimates } from '../hooks/useEstimates';
import { Estimate, FilterOptions } from '../types';
import toast from 'react-hot-toast';

export function EstimatesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{estimate: Estimate} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filters: FilterOptions = useMemo(() => ({
    searchTerm: searchTerm || undefined,
    status: statusFilter || undefined,
    insuranceCompany: insuranceFilter || undefined
  }), [searchTerm, statusFilter, insuranceFilter]);

  const { estimates, loading, error } = useEstimates(filters);

  // Get unique insurance companies for filter dropdown
  const insuranceCompanies = useMemo(() => {
    const companies = new Set(estimates.map(est => est.insuranceCompany));
    return Array.from(companies).sort();
  }, [estimates]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'Parsed';
      case 'needs_review':
        return 'Needs Review';
      case 'error':
        return 'Error';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'bg-green-100 text-green-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteEstimate = async (estimate: Estimate, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigation to estimate detail
    event.stopPropagation(); // Prevent row click
    setDeleteConfirm({ estimate });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      const estimateRef = doc(db, 'estimates', deleteConfirm.estimate.id);
      await deleteDoc(estimateRef);
      
      toast.success('Estimate deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast.error('Failed to delete estimate. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600">Loading estimates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading estimates</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Estimates</h1>
        <Link
          to="/upload"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Upload New Estimate
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, claim number, job number, or insurance..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-4 w-4 mr-1" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="parsed">Parsed</option>
                <option value="needs_review">Needs Review</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Company
              </label>
              <select
                value={insuranceFilter}
                onChange={(e) => setInsuranceFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Insurance Companies</option>
                {insuranceCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="text-gray-600">
        {estimates.length} estimate{estimates.length !== 1 ? 's' : ''} found
      </p>

      {/* Estimates Table */}
      {estimates.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estimates.map((estimate) => (
                  <Link key={estimate.id} to={`/estimates/${estimate.id}`} className="contents">
                    <tr className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(estimate.createdAt, 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estimate.jobNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estimate.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estimate.claimNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estimate.insuranceCompany}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${estimate.totals.insurancePay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estimate.status)}`}>
                          {getStatusIcon(estimate.status)}
                          <span className="ml-1">{getStatusText(estimate.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-primary-600 inline-flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </span>
                            <button
                              onClick={(e) => handleDeleteEstimate(estimate, e)}
                              className="inline-flex items-center p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete estimate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {estimate.fileName && (
                            <span className="text-gray-500 text-xs ml-2">
                              {estimate.fileName}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Link>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter || insuranceFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by uploading your first CCC One estimate.'
            }
          </p>
          <Link
            to="/upload"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Upload Estimate
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
                    Customer: {deleteConfirm.estimate.customerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Claim: {deleteConfirm.estimate.claimNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Amount: ${deleteConfirm.estimate.totals.insurancePay.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3 space-x-4 flex justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
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
