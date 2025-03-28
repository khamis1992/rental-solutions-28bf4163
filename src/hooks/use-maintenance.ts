
import { supabase } from '@/integrations/supabase/client';
import { useCrudApi } from './use-api';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { UseQueryResult } from '@tanstack/react-query';

// Define the Maintenance type that matches the actual database schema
export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  description: string;
  maintenance_type: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  completed_date: string;
  cost: number;
  service_type: string;
  performed_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  // Fields expected by the UI components
  invoice_number?: string;
  service_provider?: string;
  odometer_reading?: number;
  vehicles?: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    image_url?: string;
  };
};

export function useMaintenance() {
  const maintenanceApi = useCrudApi<MaintenanceRecord, Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>>(
    'maintenance',
    {
      getAll: async () => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      },
      
      getById: async (id: string) => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
      
      create: async (maintenanceData: any) => {
        const { data, error } = await supabase
          .from('maintenance')
          .insert(maintenanceData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      
      update: async (id: string, maintenanceData: any) => {
        const { data, error } = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      
      delete: async (id: string) => {
        const { error } = await supabase
          .from('maintenance')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
    }
  );

  // Utility function to convert API responses to expected format
  const formatMaintenanceData = (data: MaintenanceRecord): MaintenanceRecord => {
    // Ensure properties expected by UI components
    return {
      ...data,
      service_provider: data.service_provider || data.performed_by || '',
      invoice_number: data.invoice_number || '',
      odometer_reading: data.odometer_reading || 0,
    };
  };

  const getByVehicleId = async (vehicleId: string): Promise<MaintenanceRecord[]> => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('scheduled_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(formatMaintenanceData);
  };
  
  const getMaintenanceStatistics = async (vehicleId?: string) => {
    let query = supabase
      .from('maintenance')
      .select('status, count', { count: 'exact' });
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    return { totalRecords: count || 0 };
  };

  // Get all maintenance records without React Query (for components that need direct Promise)
  const getAllRecords = async (): Promise<MaintenanceRecord[]> => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*, vehicles(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(formatMaintenanceData);
  };

  return {
    ...maintenanceApi,
    getByVehicleId,
    getMaintenanceStatistics,
    // Add the direct Promise-based methods for components that need them
    getAllRecords,
    // Use the same name that some components expect
    getMaintenanceByVehicleId: getByVehicleId,
    // Add the aliases that are being used in components
    useList: maintenanceApi.getAll,
    useOne: maintenanceApi.getById,
    useCreate: maintenanceApi.create, 
    useUpdate: maintenanceApi.update,
    useDelete: maintenanceApi.remove
  };
}
