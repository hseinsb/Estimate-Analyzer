import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EstimatesList } from '../components/EstimatesList';
import toast from 'react-hot-toast';

export function Estimates() {
  const location = useLocation();

  useEffect(() => {
    // Show success message if coming from upload
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear the state to prevent showing the message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EstimatesList />
      </div>
    </div>
  );
}
