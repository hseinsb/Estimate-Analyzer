import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function AuthTest() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      // Create a test user or sign in
      await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      console.log('User created/signed in successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Try to sign in instead
        await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
        console.log('User signed in successfully');
      } else {
        console.error('Auth error:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      {user ? (
        <div>
          <p className="text-green-600 mb-2">✅ User is signed in</p>
          <p className="text-sm text-gray-600 mb-4">
            Email: {user.email}<br/>
            UID: {user.uid}
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p className="text-red-600 mb-4">❌ User is not signed in</p>
          <button
            onClick={handleSignIn}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In (Test User)
          </button>
        </div>
      )}
    </div>
  );
}
