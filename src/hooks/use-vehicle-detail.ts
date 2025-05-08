
import { useState, useEffect } from 'react';
import { useVehicle } from '@/hooks/use-vehicle';
import { Vehicle } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-response-helpers';

export const useVehicleDetail = (vehicleId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get vehicle details
  const { vehicleDetails } = useVehicle(vehicleId);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get vehicle details from our hook
      if (vehicleDetails) {
        setVehicle(vehicleDetails);
      } else {
        // Fallback direct fetch if vehicleDetails is not available
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
        
        if (vehicleError) {
          throw vehicleError;
        }
        
        setVehicle(vehicleData as Vehicle);
      }

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
  }, [vehicleId, vehicleDetails]);

  return {
    vehicle,
    leases,
    isLoading,
    error,
    refetch: fetchData
  };
};
