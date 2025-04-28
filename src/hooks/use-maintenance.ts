
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DbId } from '@/types/database-common';
import { toast } from 'sonner';

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'regular_inspection' | 'oil_change' | 'repair' | 'tire_replacement' | 'service' | 'other';

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  description: string;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  service_type?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
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
  const queryClient = useQueryClient();
  
  // Utility function to convert API responses to expected format with safe default values
  const formatMaintenanceData = (data: any): MaintenanceRecord => {
    if (!data) {
      console.warn("Received null or undefined data in formatMaintenanceData");
      return {
        id: "",
        vehicle_id: "",
        description: "",
        maintenance_type: "regular_inspection" as MaintenanceType,
        status: "scheduled" as MaintenanceStatus,
        scheduled_date: new Date().toISOString(),
        cost: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
    // Validate maintenance_type
    const validMaintenanceTypes: MaintenanceType[] = [
      'regular_inspection', 'oil_change', 'repair', 
      'tire_replacement', 'service', 'other'
    ];
    const isValidMaintenanceType = validMaintenanceTypes.includes(data.maintenance_type as MaintenanceType);
    const safeMaintenanceType = isValidMaintenanceType 
      ? data.maintenance_type 
      : "regular_inspection";
    
    // Validate status
    const validStatuses: MaintenanceStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];
    const isValidStatus = validStatuses.includes(data.status as MaintenanceStatus);
    const safeStatus = isValidStatus ? data.status : "scheduled";
    
    // Map database fields to UI fields
    return {
      ...data,
      id: data.id || '',
      vehicle_id: data.vehicle_id || '',
      maintenance_type: safeMaintenanceType as MaintenanceType,
      status: safeStatus as MaintenanceStatus,
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

  // Main queries and mutations
  const getAll = () => {
    return useQuery({
      queryKey: ['maintenance'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(formatMaintenanceData);
      }
    });
  };
  
  const getById = (id: string | undefined) => {
    return useQuery({
      queryKey: ['maintenance', id],
      queryFn: async () => {
        if (!id) throw new Error("Maintenance ID is required");
        
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return formatMaintenanceData(data);
      },
      enabled: !!id
    });
  };

  const getByVehicleId = (vehicleId: string | undefined) => {
    return useQuery({
      queryKey: ['maintenance', 'vehicle', vehicleId],
      queryFn: async () => {
        if (!vehicleId) return [];
        
        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(*)')
          .eq('vehicle_id', vehicleId)
          .order('scheduled_date', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(formatMaintenanceData);
      },
      enabled: !!vehicleId
    });
  };

  const create = () => {
    return useMutation({
      mutationFn: async (maintenanceData: any) => {
        // Map UI fields to database fields before submitting
        const formattedData = {
          vehicle_id: maintenanceData.vehicle_id,
          maintenance_type: maintenanceData.maintenance_type || 'regular_inspection',
          status: maintenanceData.status || 'scheduled',
          description: maintenanceData.description || '',
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          cost: maintenanceData.cost,
          notes: maintenanceData.notes,
          // Map UI fields to the actual database fields
          performed_by: maintenanceData.service_provider,
          service_type: maintenanceData.invoice_number,
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        toast.success("Maintenance record created successfully");
      },
      onError: (error) => {
        toast.error(`Failed to create maintenance record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({ id, data: maintenanceData }: { id: string; data: any }) => {
        // Map UI fields to database fields
        const formattedData = {
          vehicle_id: maintenanceData.vehicle_id,
          maintenance_type: maintenanceData.maintenance_type || 'regular_inspection',
          status: maintenanceData.status || 'scheduled',
          description: maintenanceData.description || '',
          scheduled_date: maintenanceData.scheduled_date?.toISOString(),
          completion_date: maintenanceData.completion_date?.toISOString(),
          cost: maintenanceData.cost,
          notes: maintenanceData.notes,
          performed_by: maintenanceData.service_provider,
          service_type: maintenanceData.invoice_number,
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        toast.success("Maintenance record updated successfully");
      },
      onError: (error) => {
        toast.error(`Failed to update maintenance record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const remove = () => {
    return useMutation({
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
        toast.success("Maintenance record deleted successfully");
      },
      onError: (error) => {
        toast.error(`Failed to delete maintenance record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  // Add the direct Promise-based methods for components that need them
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

  const getMaintenanceByVehicleId = async (vehicleId: string): Promise<MaintenanceRecord[]> => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*, vehicles(*)')
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

  return {
    getAll,
    getById,
    getByVehicleId,
    create,
    update,
    remove,
    getMaintenanceStatistics,
    getAllRecords,
    getMaintenanceByVehicleId,
    // Add the aliases that are being used in components
    useList: getAll,
    useOne: getById,
    useCreate: create, 
    useUpdate: update,
    useDelete: remove
  };
}
