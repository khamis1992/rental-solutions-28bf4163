
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { asVehicleId } from '@/utils/database-type-helpers';

export function useVehicleMaintenanceHistory(vehicleId?: string) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-maintenance', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      
      setMaintenanceRecords(data || []);
      return data || [];
    },
    enabled: !!vehicleId
  });

  return {
    maintenanceRecords,
    isLoading,
    error,
    refetch
  };
}
