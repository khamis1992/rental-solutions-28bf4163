
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/lib/supabase';
import { handleApiError } from '@/hooks/use-api';

export const useVehicleTypes = () => {
  return useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      try {
        const { isHealthy, error: connectionError } = await checkSupabaseHealth();
        
        if (!isHealthy) {
          console.error('Database connection error when fetching vehicle types:', connectionError);
          throw new Error(`Database connection error: ${connectionError || 'Failed to connect'}`);
        }
        
        const { data, error } = await supabase
          .from('vehicle_types')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('Error fetching vehicle types:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('No vehicle types found or empty response');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch vehicle types:', error);
        handleApiError(error, 'Failed to fetch vehicle types');
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
