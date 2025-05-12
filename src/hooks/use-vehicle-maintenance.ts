
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { asVehicleId } from '@/utils/database-type-helpers';

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  maintenance_type?: string;
  service_type?: string;
  description?: string;
  scheduled_date?: string | Date;
  completed_date?: string | Date;
  status?: string;
  cost?: number;
  performed_by?: string;
  notes?: string;
  [key: string]: any;
}

export function useVehicleMaintenanceHistory(vehicleId?: string) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-maintenance', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .eq('vehicle_id', asVehicleId(vehicleId))
          .order('scheduled_date', { ascending: false });
        
        if (error) throw error;
        
        setMaintenanceRecords(data || []);
        return data || [];
      } catch (err) {
        console.error("Error fetching maintenance records:", err);
        throw err;
      }
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
