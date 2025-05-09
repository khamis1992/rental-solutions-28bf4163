
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
      const vehicleData = await vehicleService.getVehicleDetails(vehicleId);
      setVehicle(vehicleData);
      setError(null);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
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
