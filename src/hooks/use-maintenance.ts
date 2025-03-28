
import { supabase } from '@/integrations/supabase/client';
import { useCrudApi } from './use-api';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { UseQueryResult } from '@tanstack/react-query';

// Define the Maintenance type that matches the actual database schema
export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  description: string;
  maintenance_type: keyof typeof MaintenanceType;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  service_type?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
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
        return data ? data.map(formatMaintenanceData) : [];
      },
      
      getById: async (id: string) => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return formatMaintenanceData(data);
      },
      
      create: async (maintenanceData: any) => {
        // Ensure data format matches what Supabase expects
        const formattedData = {
          ...maintenanceData,
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          // Map UI fields to database fields if needed
          performed_by: maintenanceData.service_provider,
        };
        
        const { data, error } = await supabase
          .from('maintenance')
          .insert(formattedData)
          .select()
          .single();
        
        if (error) throw error;
        return formatMaintenanceData(data);
      },
      
      update: async (id: string, maintenanceData: any) => {
        // Ensure data format matches what Supabase expects
        const formattedData = {
          ...maintenanceData,
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          // Map UI fields to database fields if needed
          performed_by: maintenanceData.service_provider,
        };
        
        const { data, error } = await supabase
          .from('maintenance')
          .update(formattedData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return formatMaintenanceData(data);
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
  const formatMaintenanceData = (data: any): MaintenanceRecord => {
    if (!data) return {} as MaintenanceRecord;
    
    // Ensure required properties have valid defaults to prevent errors
    return {
      ...data,
      id: data.id || '',
      vehicle_id: data.vehicle_id || '',
      maintenance_type: data.maintenance_type || MaintenanceType.REGULAR_INSPECTION,
      status: data.status || MaintenanceStatus.SCHEDULED,
      description: data.description || '',
      scheduled_date: data.scheduled_date || new Date().toISOString(),
      service_provider: data.service_provider || data.performed_by || '',
      invoice_number: data.invoice_number || '',
      odometer_reading: data.odometer_reading || 0,
      cost: typeof data.cost === 'number' ? data.cost : parseFloat(data.cost) || 0,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      vehicles: data.vehicles || null
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
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, vehicles(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log("Raw maintenance data:", data);
      return (data || []).map(formatMaintenanceData);
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      throw err;
    }
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
