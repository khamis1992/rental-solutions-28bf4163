
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: 'REGULAR_INSPECTION' | 'REPAIR' | 'OTHER';
  description: string;
  scheduled_date: string;
  completed_date?: string;
  cost?: number;
  estimated_cost?: number;
  notes?: string;
  assigned_to?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export const useMaintenance = () => {
  const queryClient = useQueryClient();
  
  // Get all maintenance records
  const { data: maintenanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('scheduled_date', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as MaintenanceRecord[];
    }
  });
  
  // Add getByVehicleId function for VehicleDetail.tsx
  const getByVehicleId = async (vehicleId: string) => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('scheduled_date', { ascending: false });
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data as MaintenanceRecord[];
  };
  
  // Add getAllRecords function for MaintenanceReport.tsx
  const getAllRecords = async () => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('scheduled_date', { ascending: false });
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data as MaintenanceRecord[];
  };
  
  const addMaintenanceRecord = useMutation({
    mutationFn: async (record: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance')
        .insert([record])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
    }
  });
  
  const updateMaintenanceRecord = useMutation({
    mutationFn: async (record: MaintenanceRecord) => {
      const { data, error } = await supabase
        .from('maintenance')
        .update(record)
        .eq('id', record.id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
    }
  });
  
  const deleteMaintenanceRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
    }
  });
  
  return {
    maintenanceRecords,
    isLoading,
    error,
    addMaintenanceRecord: addMaintenanceRecord.mutateAsync,
    updateMaintenanceRecord: updateMaintenanceRecord.mutateAsync,
    deleteMaintenanceRecord: deleteMaintenanceRecord.mutateAsync,
    getByVehicleId,
    getAllRecords
  };
};
