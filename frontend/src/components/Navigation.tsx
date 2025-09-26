import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Upload, FileText, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="bg-primary-600 p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Estimate Analyzer
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>

              <Link
                to="/estimates"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/estimates') || location.pathname.startsWith('/estimates/')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 mr-1" />
                All Estimates
              </Link>

              <Link
                to="/upload"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/upload')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-gray-700 text-sm mr-4">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Sign out</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Dashboard
          </Link>

          <Link
            to="/estimates"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/estimates') || location.pathname.startsWith('/estimates/')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            All Estimates
          </Link>

          <Link
            to="/upload"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/upload')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Upload
          </Link>
        </div>
      </div>
    </nav>
  );
}
