import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function DebugApp() {
  const [status, setStatus] = useState('Initializing...');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus('Connecting to Firebase...');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setStatus('Auth state changed');
        setUser(user);
        console.log('Auth state:', user);
      });

      setStatus('Connected to Firebase');
      
      return () => {
        unsubscribe();
        setStatus('Disconnected');
      };
    } catch (err) {
      setError(err.message);
      setStatus('Error connecting to Firebase');
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Firebase Debug</h1>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>User:</strong> {user ? user.email : 'Not signed in'}</p>
      {error && <p><strong>Error:</strong> {error}</p>}
      <p><strong>Firebase Config:</strong> {auth.app.options.projectId}</p>
    </div>
  );
}

export default DebugApp;
