
import { useEffect, useState } from 'react';
import { useVehicleService } from './services/useVehicleService';
import { Vehicle } from '@/types/vehicle';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const vehicleService = useVehicleService();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicle = async () => {
    if (!vehicleId) {
      setIsLoading(false);
      setError(new Error('Vehicle ID is required'));
      return;
    }

    setIsLoading(true);
    try {
      console.log(`useVehicleDetail: Fetching vehicle details for ID ${vehicleId}`);
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
    } catch (err) {
      console.error('useVehicleDetail: Error fetching vehicle:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vehicle'));
      setVehicle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchVehicle();
  };

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  return {
    vehicle,
    isLoading,
    error,
    refetch
  };
};
