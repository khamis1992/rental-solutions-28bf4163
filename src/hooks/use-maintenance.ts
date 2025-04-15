
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: "REGULAR_INSPECTION" | "OIL_CHANGE" | "TIRE_REPLACEMENT" | "BRAKE_SERVICE" | "OTHER";
  description: string;
  scheduled_date: string;
  cost: number;
  estimated_cost?: string;
  notes?: string;
  assigned_to?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

export const useMaintenance = () => {
  const queryClient = useQueryClient();

  const { data: maintenanceRecords, isLoading, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance records:', error);
        throw new Error(error.message);
      }

      return data as MaintenanceRecord[];
    }
  });

  const addMaintenanceRecord = useMutation({
    mutationFn: async (record: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Error adding maintenance record:', error);
        throw new Error(error.message);
      }
      
      return data as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Maintenance record added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error adding maintenance record: ${error.message}`);
    }
  });

  const updateMaintenanceRecord = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }) => {
      const { data: updatedData, error } = await supabase
        .from('maintenance')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance record:', error);
        throw new Error(error.message);
      }
      
      return updatedData as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Maintenance record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error updating maintenance record: ${error.message}`);
    }
  });

  const deleteMaintenanceRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting maintenance record:', error);
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Maintenance record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error deleting maintenance record: ${error.message}`);
    }
  });

  return {
    maintenanceRecords,
    isLoading,
    error,
    addMaintenanceRecord: addMaintenanceRecord.mutateAsync,
    updateMaintenanceRecord: updateMaintenanceRecord.mutateAsync,
    deleteMaintenanceRecord: deleteMaintenanceRecord.mutateAsync
  };
};
