import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MaintenanceRecord } from '@/types/maintenance';
import { asVehicleId } from '@/utils/type-casting';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';

/**
 * Hook for managing vehicle maintenance records
 */
export function useMaintenance(vehicleId: string) {
  const queryClient = useQueryClient();

  const {
    data: maintenanceRecords = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: async () => {
      const response = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('created_at', { ascending: false });

      if (hasData(response)) {
        return response.data as MaintenanceRecord[];
      }

      console.error("Error fetching maintenance records:", getErrorMessage(response));
      return [];
    },
    enabled: !!vehicleId,
  });

  const create = useMutation({
    mutationFn: async (newRecord: Partial<MaintenanceRecord>) => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert({
          ...newRecord,
          status: newRecord.status || 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceRecord;
    },
    onSuccess: () => {
      toast.success('Maintenance record created successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create maintenance record: ${error.message}`);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }) => {
      const { data: updatedRecord, error } = await supabase
        .from('maintenance')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecord as MaintenanceRecord;
    },
    onSuccess: () => {
      toast.success('Maintenance record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update maintenance record: ${error.message}`);
    },
  });

  const deleteMaintenance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Maintenance record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance', vehicleId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete maintenance record: ${error.message}`);
    },
  });

  const getAllRecords = async (): Promise<MaintenanceRecord[]> => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*, vehicles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance records:', error);
      return [];
    }

    return data as MaintenanceRecord[];
  };

  return {
    maintenanceRecords,
    isLoading,
    isError,
    error,
    create,
    update,
    delete: deleteMaintenance,
    getAllRecords,
  };
}

/**
 * Legacy alias for compatibility
 */
export const useMaintenanceRecords = useMaintenance;
