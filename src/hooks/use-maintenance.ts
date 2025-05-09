
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaintenanceRecord } from '@/types/maintenance';
import { toast } from 'sonner';

export const useMaintenance = (tableName = 'maintenance') => {
  const queryClient = useQueryClient();

  // Fetch all maintenance records
  const {
    data: maintenanceRecords = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, vehicles(id, make, model, year, license_plate, color, image_url)');

      if (error) throw error;
      return data as MaintenanceRecord[];
    }
  });

  // Get a single maintenance record by ID
  const getMaintenanceById = async (id: string): Promise<MaintenanceRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, vehicles(id, make, model, year, license_plate, color, image_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MaintenanceRecord;
    } catch (err) {
      console.error("Error fetching maintenance by ID:", err);
      return null;
    }
  };
  
  // Get all maintenance records
  const getAllRecords = async (): Promise<MaintenanceRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, vehicles(id, make, model, year, license_plate, color, image_url)');

      if (error) throw error;
      return data as MaintenanceRecord[];
    } catch (err) {
      console.error("Error fetching all maintenance records:", err);
      return [];
    }
  };

  // Create a new maintenance record
  const create = useMutation({
    mutationFn: async (newRecord: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert(newRecord)
        .select('*')
        .single();

      if (error) {
        toast.error(`Failed to create maintenance record: ${error.message}`);
        throw error;
      }

      return data as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  // Update an existing maintenance record
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }): Promise<MaintenanceRecord> => {
      const { data: updatedData, error } = await supabase
        .from('maintenance')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        toast.error(`Failed to update maintenance record: ${error.message}`);
        throw error;
      }

      return updatedData as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  // Delete a maintenance record
  const deleteMaintenance = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(`Failed to delete maintenance record: ${error.message}`);
        throw error;
      }
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
    delete: deleteMaintenance,
    getAllRecords,
    getMaintenanceById
  };
};
