
import { useState, useEffect } from 'react';
import { useVehicle } from '@/hooks/use-vehicles';
import { Vehicle } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-response-helpers';

export const useVehicleDetail = (vehicleId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get vehicle details from the useVehicle hook
  const { getVehicleById } = useVehicle();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get vehicle details
      const vehicleDetails = await getVehicleById(vehicleId);
      setVehicle(vehicleDetails);

      // Get leases for the vehicle
      const { data: vehicleLeases, error: leasesError } = await supabase
        .from('leases')
        .select(`
          id, 
          start_date, 
          end_date, 
          status, 
          customer_id,
          total_amount,
          profiles:customer_id (id, full_name, phone_number, email)
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });
      
      if (leasesError) {
        throw leasesError;
      }
      
      setLeases(vehicleLeases || []);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
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
