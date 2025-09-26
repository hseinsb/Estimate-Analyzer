import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Removed Storage and Functions imports for Spark plan

const firebaseConfig = {
  apiKey: "AIzaSyAna5MabetiJyzvcSraUz_ipeSvNx3HZO8",
  authDomain: "estimate-analyzer-ca4c6.firebaseapp.com",
  projectId: "estimate-analyzer-ca4c6",
  storageBucket: "estimate-analyzer-ca4c6.firebasestorage.app",
  messagingSenderId: "1056245930643",
  appId: "1:1056245930643:web:852b4fe9ae4ffe45774b66",
  measurementId: "G-JW75K1VH7Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (Auth and Firestore only for Spark plan)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Note: Storage and Functions removed for Firebase Spark (free) plan compatibility

export default app;