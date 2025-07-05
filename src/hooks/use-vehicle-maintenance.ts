
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
      if (!vehicleId) {
        console.log("useVehicleMaintenanceHistory: No vehicle ID provided");
        return [];
      }
      
      try {
        console.log("Fetching maintenance records for vehicle:", vehicleId);

        // Use explicit table references to avoid ambiguity
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('scheduled_date', { ascending: false });
        
        if (error) {
          console.error("Error fetching maintenance records:", error);
          throw error;
        }
        
        console.log("Maintenance records fetched:", data);
        
        const safeData = data || [];
        setMaintenanceRecords(safeData);
        return safeData;
      } catch (err) {
        console.error("Error fetching maintenance records:", err);
        throw err;
      }
    },
    enabled: !!vehicleId // Only run query when vehicleId exists
  });

  // Update maintenance records when vehicleId changes
  useEffect(() => {
    console.log("useVehicleMaintenanceHistory: useEffect with vehicleId:", vehicleId);
    if (vehicleId) {
      refetch();
    } else {
      // Reset state when vehicleId is not available
      setMaintenanceRecords([]);
    }
  }, [vehicleId, refetch]); // Include refetch in dependencies

  return {
    maintenanceRecords,
    isLoading,
    error,
    refetch
  };
}
