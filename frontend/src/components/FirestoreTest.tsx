import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export function FirestoreTest() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testFirestoreWrite = async () => {
    if (!user) {
      setResult('❌ No user authenticated');
      return;
    }

    setTesting(true);
    setResult('Testing...');

    try {
      // Try to write a simple test document
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello Firestore!',
        userId: user.uid,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      setResult(`✅ Success! Document ID: ${docRef.id}`);
    } catch (error: any) {
      console.error('Firestore test error:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Firestore Test</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            User: {user ? `${user.email} (${user.uid})` : 'Not authenticated'}
          </p>
        </div>

        <button
          onClick={testFirestoreWrite}
          disabled={testing || !user}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing...' : 'Test Firestore Write'}
        </button>

        {result && (
          <div className="p-3 bg-white rounded border">
            <p className="text-sm">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
