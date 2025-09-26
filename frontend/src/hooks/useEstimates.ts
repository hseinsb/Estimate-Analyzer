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
    if (!id) {
      setError('No estimate ID provided');
      setLoading(false);
      return;
    }

    const fetchEstimate = async () => {
      try {
        console.log('Fetching estimate with ID:', id);
        const docRef = doc(db, 'estimates', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Estimate data found:', data);
          
          // Safer date conversion
          let createdAt: Date | null = null;
          let updatedAt: Date | null = null;
          
          try {
            createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
            updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null);
          } catch (dateError) {
            console.warn('Date conversion error:', dateError);
          }
          
          setEstimate({
            id: docSnap.id,
            ...data,
            createdAt,
            updatedAt
          } as Estimate);
        } else {
          console.warn('Estimate not found with ID:', id);
          setError('Estimate not found');
        }
      } catch (err) {
        console.error('Error fetching estimate:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch estimate');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  return { estimate, loading, error };
}
