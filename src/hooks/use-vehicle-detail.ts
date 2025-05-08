
import { useState, useEffect } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useLeases } from '@/hooks/use-leases';
import { Vehicle } from '@/types/vehicle';

export const useVehicleDetail = (vehicleId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get vehicle details from the useVehicles hook
  const { getVehicleById } = useVehicles();
  const leasesHook = useLeases();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get vehicle details
      const vehicleDetails = await getVehicleById(vehicleId);
      setVehicle(vehicleDetails);

      // Get leases for the vehicle
      const vehicleLeases = await leasesHook.getVehicleLeases(vehicleId);
      setLeases(vehicleLeases);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId]);

  return {
    vehicle,
    leases,
    isLoading,
    error,
    refetch: fetchData
  };
};
