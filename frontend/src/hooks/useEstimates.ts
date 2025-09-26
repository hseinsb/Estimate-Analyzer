import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Estimate, FilterOptions } from '../types';

export function useEstimates(filters?: FilterOptions) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(100)
    ];

    // Add filters
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.insuranceCompany) {
      constraints.push(where('insuranceCompany', '==', filters.insuranceCompany));
    }

    if (filters?.dateRange) {
      constraints.push(where('createdAt', '>=', filters.dateRange.start));
      constraints.push(where('createdAt', '<=', filters.dateRange.end));
    }

    const q = query(collection(db, 'estimates'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const estimatesData: Estimate[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          estimatesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Estimate);
        });

        // Apply client-side search filter
        let filteredEstimates = estimatesData;
        if (filters?.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          filteredEstimates = estimatesData.filter(estimate =>
            estimate.customerName.toLowerCase().includes(searchTerm) ||
            estimate.claimNumber.toLowerCase().includes(searchTerm) ||
            estimate.jobNumber?.toLowerCase().includes(searchTerm) ||
            estimate.insuranceCompany.toLowerCase().includes(searchTerm)
          );
        }

        setEstimates(filteredEstimates);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters]);

  return { estimates, loading, error };
}

export function useEstimate(id: string) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEstimate = async () => {
      try {
        const docRef = doc(db, 'estimates', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEstimate({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Estimate);
        } else {
          setError('Estimate not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch estimate');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  return { estimate, loading, error };
}
