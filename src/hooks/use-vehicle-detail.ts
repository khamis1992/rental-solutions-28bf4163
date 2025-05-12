
import { useEffect, useState, useCallback } from 'react';
import { useVehicleService } from './services/useVehicleService';
import { Vehicle } from '@/types/vehicle';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const vehicleService = useVehicleService();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(true);
  const MAX_RETRIES = 3;

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) {
      setIsLoading(false);
      setError(new Error('Vehicle ID is required'));
      return;
    }

    setIsLoading(true);
    try {
      console.log(`useVehicleDetail: Fetching vehicle details for ID ${vehicleId} (attempt ${retryCount + 1})`);
      const vehicleData = await vehicleService.getVehicleDetails(vehicleId);
      
      if (!vehicleData) {
        throw new Error(`No data returned for vehicle ID ${vehicleId}`);
      }
      
      console.log(`useVehicleDetail: Successfully fetched vehicle data:`, 
                 JSON.stringify({
                   id: vehicleData.id,
                   make: vehicleData.make,
                   model: vehicleData.model,
                   hasVehicleType: !!vehicleData.vehicleType
                 }));
      
      setVehicle(vehicleData);
      setError(null);
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (err) {
      console.error('useVehicleDetail: Error fetching vehicle:', err);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Stop retrying if we've hit the max or if it's a database table/schema error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        retryCount >= MAX_RETRIES || 
        errorMessage.includes("does not exist") || 
        errorMessage.includes("schema") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("column")
      ) {
        console.log(`useVehicleDetail: Stopping retries after ${retryCount + 1} attempts or due to database error`);
        setShouldRetry(false);
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch vehicle'));
      setVehicle(null);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, vehicleService, retryCount]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  // Add a retry with delay, only if shouldRetry is true and we haven't hit max retries
  useEffect(() => {
    if (!isLoading && error && shouldRetry && retryCount > 0 && retryCount < MAX_RETRIES) {
      const timeout = setTimeout(() => {
        console.log(`useVehicleDetail: Retrying fetch (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        fetchVehicle();
      }, 2000 * retryCount); // Exponential backoff: 2s, 4s, 6s
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, error, shouldRetry, retryCount, fetchVehicle]);

  return {
    vehicle,
    isLoading,
    error,
    refetch: fetchVehicle
  };
};
