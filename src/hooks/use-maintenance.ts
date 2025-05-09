
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaintenanceRecord } from '@/types/maintenance';

export const useMaintenance = (vehicleId: string = '') => {
  const queryClient = useQueryClient();

  // Fetch all maintenance records
  const { data: maintenanceRecords = [], isLoading, isError, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: getAllRecords
  });

  async function getAllRecords(): Promise<MaintenanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  }

  // Create new maintenance record
  const create = useMutation({
    mutationFn: async (newRecord: Partial<MaintenanceRecord>) => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  // Update maintenance record
  const update = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<MaintenanceRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  // Delete maintenance record
  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  return {
    maintenanceRecords,
    isLoading,
    isError,
    error,
    create,
    update,
    delete: deleteRecord,
    getAllRecords
  };
};
