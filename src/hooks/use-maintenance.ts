
import { supabase } from '@/integrations/supabase/client';
import { useCrudApi } from '@/hooks/api/use-crud-api'; // Changed from './use-api' to '@/hooks/api/use-crud-api'
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { UseQueryResult } from '@tanstack/react-query';
import { asTableId } from '@/utils/type-casting';

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
        // Map UI fields to database fields before submitting
        const formattedData = {
          vehicle_id: maintenanceData.vehicle_id,
          maintenance_type: maintenanceData.maintenance_type || MaintenanceType.REGULAR_INSPECTION,
          status: maintenanceData.status || MaintenanceStatus.SCHEDULED,
          description: maintenanceData.description || '',
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          cost: maintenanceData.cost,
          notes: maintenanceData.notes,
          // Map UI fields to the actual database fields
          performed_by: maintenanceData.service_provider,
          service_type: maintenanceData.invoice_number, // Store invoice number in service_type field
          // Add odometer reading if available
          ...(maintenanceData.odometer_reading ? { odometer_reading: maintenanceData.odometer_reading } : {})
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
        // Map UI fields to database fields before submitting
        const formattedData = {
          vehicle_id: maintenanceData.vehicle_id,
          maintenance_type: maintenanceData.maintenance_type || MaintenanceType.REGULAR_INSPECTION,
          status: maintenanceData.status || MaintenanceStatus.SCHEDULED,
          description: maintenanceData.description || '',
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          cost: maintenanceData.cost,
          notes: maintenanceData.notes,
          // Map UI fields to the actual database fields
          performed_by: maintenanceData.service_provider,
          service_type: maintenanceData.invoice_number, // Store invoice number in service_type field
          // Add odometer reading if available
          ...(maintenanceData.odometer_reading ? { odometer_reading: maintenanceData.odometer_reading } : {})
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

  // Utility function to convert API responses to expected format with safe default values
  const formatMaintenanceData = (data: any): MaintenanceRecord => {
    if (!data) {
      console.warn("Received null or undefined data in formatMaintenanceData");
      return {
        id: "",
        vehicle_id: "",
        description: "",
        maintenance_type: MaintenanceType.REGULAR_INSPECTION,
        status: MaintenanceStatus.SCHEDULED,
        scheduled_date: new Date().toISOString(),
        cost: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MaintenanceRecord;
    }
    
    // Validate maintenance_type to ensure it's a valid enum value
    const isValidMaintenanceType = Object.values(MaintenanceType).includes(data.maintenance_type as any);
    const safeMaintenanceType = isValidMaintenanceType 
      ? data.maintenance_type 
      : MaintenanceType.REGULAR_INSPECTION;
    
    // Validate status to ensure it's a valid enum value
    const validStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
    const isValidStatus = validStatuses.includes(data.status);
    const safeStatus = isValidStatus ? data.status : MaintenanceStatus.SCHEDULED;
    
    // Map database fields to UI fields
    return {
      ...data,
      id: data.id || '',
      vehicle_id: data.vehicle_id || '',
      maintenance_type: safeMaintenanceType,
      status: safeStatus,
      description: data.description || '',
      scheduled_date: data.scheduled_date || new Date().toISOString(),
      // Map database fields to UI fields
      service_provider: data.performed_by || '',  // Map performed_by to service_provider
      invoice_number: data.service_type || '',    // Map service_type to invoice_number
      odometer_reading: typeof data.odometer_reading === 'number' ? data.odometer_reading : 0,
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
      .eq('vehicle_id', asTableId('vehicles', vehicleId))
      .order('scheduled_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(formatMaintenanceData);
  };
  
  const getMaintenanceStatistics = async (vehicleId?: string) => {
    let query = supabase
      .from('maintenance')
      .select('status, count', { count: 'exact' });
    
    if (vehicleId) {
      query = query.eq('vehicle_id', asTableId('vehicles', vehicleId));
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
