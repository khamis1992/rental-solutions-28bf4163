
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrafficFine } from '@/types/traffic-fine';

interface TrafficFineParams {
  leaseId?: string;
  vehicleId?: string;
  page?: number;
  pageSize?: number;
}

export function useTrafficFineService(params: TrafficFineParams = {}) {
  const { leaseId, vehicleId, page = 1, pageSize = 10 } = params;
  
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchFines = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Start building the query
      let query = supabase.from('traffic_fines').select('*', { count: 'exact' });
      
      // Apply filters
      if (leaseId) {
        query = query.eq('lease_id', leaseId);
      }
      
      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }
      
      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      // Execute the query
      const { data, count, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Set the data and pagination info
      setTrafficFines(data as TrafficFine[]);
      
      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (err) {
      console.error('Error fetching traffic fines:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch traffic fines'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data when params change
  useEffect(() => {
    fetchFines();
  }, [leaseId, vehicleId, page, pageSize]);
  
  return {
    trafficFines,
    isLoading,
    error,
    totalPages,
    refetch: fetchFines
  };
}
