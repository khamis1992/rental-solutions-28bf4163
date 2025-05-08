
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MaintenanceRecord } from '@/types/maintenance';
import { asVehicleId } from '@/utils/type-casting';
import { hasResponseData } from '@/utils/supabase-response-helpers';

export function useMaintenanceRecords(vehicleId?: string) {
  const queryClient = useQueryClient();

  const { data: maintenanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];

      const response = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', asVehicleId(vehicleId))
        .order('created_at', { ascending: false });

      if (hasResponseData(response)) {
        return response.data as MaintenanceRecord[];
      }

      console.error('Error fetching maintenance records:', response.error);
      return [];
    },
    enabled: !!vehicleId,
  });

  const createMaintenanceRecord = useMutation({
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
    onError: (error) => {
      toast.error(`Failed to create maintenance record: ${error.message}`);
    },
  });

  const updateMaintenanceRecord = useMutation({
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
    onError: (error) => {
      toast.error(`Failed to update maintenance record: ${error.message}`);
    },
  });

  const deleteMaintenanceRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Maintenance record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance', vehicleId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete maintenance record: ${error.message}`);
    },
  });

  return {
    maintenanceRecords,
    isLoading,
    error,
    createMaintenanceRecord: createMaintenanceRecord.mutateAsync,
    updateMaintenanceRecord: updateMaintenanceRecord.mutateAsync,
    deleteMaintenanceRecord: deleteMaintenanceRecord.mutateAsync,
  };
}
