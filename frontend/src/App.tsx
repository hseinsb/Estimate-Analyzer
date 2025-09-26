import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Navigation } from './components/Navigation';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Estimates } from './pages/Estimates';
import { EstimateDetailPage } from './pages/EstimateDetailPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/estimates" element={<Estimates />} />
            <Route path="/estimates/:id" element={<EstimateDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
