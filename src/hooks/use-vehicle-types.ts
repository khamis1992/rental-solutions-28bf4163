
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('vehicle-types');

export function useVehicleTypes() {
  const { data: vehicleTypes, isLoading, error } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      logger.debug('Fetching vehicle types');
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .order('name');
      
      if (error) {
        logger.error('Failed to fetch vehicle types:', error);
        throw new Error(`Failed to load vehicle types: ${error.message}`);
      }
      
      return data || [];
    }
  });

  return {
    vehicleTypes,
    isLoading,
    error
  };
}
