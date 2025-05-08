
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { VehicleId } from '@/lib/database/database-types';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';

/**
 * Hook to fetch leases (agreements) related to vehicles
 */
export const useLeases = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all leases for a specific vehicle
   * @param vehicleId The ID of the vehicle to get leases for
   * @returns Array of lease agreements
   */
  const getVehicleLeases = async (vehicleId: string): Promise<any[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase
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
        .eq('vehicle_id', vehicleId as VehicleId)
        .order('created_at', { ascending: false });

      if (!hasData(response)) {
        console.error("Error fetching vehicle leases:", getErrorMessage(response));
        return [];
      }

      return response.data;
    } catch (err) {
      console.error("Unexpected error in getVehicleLeases:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getVehicleLeases,
    isLoading,
    error
  };
};
