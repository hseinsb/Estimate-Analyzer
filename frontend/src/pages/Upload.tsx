import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '../components/UploadForm';

export function Upload() {
  const navigate = useNavigate();

  const handleUploadSuccess = (uploadId: string) => {
    // Navigate to the estimates list after successful upload
    navigate('/estimates', { 
      state: { 
        message: 'PDF uploaded successfully! Processing in progress...',
        uploadId 
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <UploadForm onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
