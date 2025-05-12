
import { useEffect, useState, useCallback } from 'react';
import { useVehicleService } from './services/useVehicleService';
import { Vehicle } from '@/types/vehicle';
import { useQuery } from '@tanstack/react-query';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const vehicleService = useVehicleService();
  const [error, setError] = useState<Error | null>(null);
  
  // Use React Query for data fetching with proper caching
  const {
    data: vehicle,
    isLoading,
    refetch,
    error: queryError
  } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      try {
        console.log(`useVehicleDetail: Fetching vehicle details for ID ${vehicleId}`);
        const vehicleData = await vehicleService.getVehicleDetails(vehicleId);
        
        if (!vehicleData) {
          throw new Error(`No data returned for vehicle ID ${vehicleId}`);
        }
        
        return vehicleData as Vehicle;
      } catch (err) {
        console.error('useVehicleDetail: Error fetching vehicle:', err);
        throw err;
      }
    },
    staleTime: 60000, // Data remains fresh for 1 minute
    cacheTime: 300000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once on failure
    enabled: !!vehicleId // Only run query if vehicleId is provided
  });

  // Handle and expose any errors from the query
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Failed to fetch vehicle'));
    } else {
      setError(null);
    }
  }, [queryError]);

  return {
    vehicle,
    isLoading,
    error: error || queryError,
    refetch
  };
};
