
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface VehicleType {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const useVehicleTypes = () => {
  const { data: vehicleTypes, isLoading, error } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching vehicle types:', error);
        throw new Error(error.message);
      }

      return data as VehicleType[];
    }
  });

  return {
    vehicleTypes,
    isLoading,
    error
  };
};
