
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { asVehicleId } from '@/utils/database-type-helpers';

export function useVehicleAgreements(vehicleId?: string) {
  const [agreements, setAgreements] = useState<any[]>([]);

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-agreements', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      
      const { data, error } = await supabase
        .from('leases')
        .select('*, customers(full_name)')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAgreements(data || []);
      return data || [];
    },
    enabled: !!vehicleId
  });

  return {
    agreements,
    isLoading,
    error,
    refetch
  };
}
