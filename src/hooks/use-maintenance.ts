
import { useApiMutation, useApiQuery } from './use-api';
import { useState } from 'react';
import { useToast } from './use-toast';
import { MaintenanceStatus, MaintenanceStatusType } from '@/lib/validation-schemas/maintenance';
import { supabase } from '@/integrations/supabase/client';

// Function to map frontend status to database status
const mapStatusToDb = (status: string | undefined): MaintenanceStatusType | undefined => {
  if (!status || status === 'all') return undefined;
  
  // Ensure we're only returning valid status types
  const validStatuses: MaintenanceStatusType[] = [
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS, 
    MaintenanceStatus.COMPLETED, 
    MaintenanceStatus.CANCELLED
  ];
  
  return validStatuses.includes(status as MaintenanceStatusType) 
    ? (status as MaintenanceStatusType) 
    : undefined;
};

// Helper to ensure all required fields are present in the maintenance record
const normalizeMaintenanceRecord = (record: any) => {
  if (!record) return null;
  
  return {
    ...record,
    service_provider: record.service_provider || null,
    invoice_number: record.invoice_number || null,
    notes: record.notes || null,
    description: record.description || null,
    // Ensure dates are properly formatted or null
    scheduled_date: record.scheduled_date || null,
    completion_date: record.completion_date || null,
    created_at: record.created_at || null,
    updated_at: record.updated_at || null
  };
};

export function useMaintenance() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    vehicleId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // Define CRUD endpoints
  const maintenanceEndpoints = {
    getAll: async () => {
      try {
        let query = supabase.from('maintenance').select('*');
        
        // Apply filters if provided
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        
        if (filters.status) {
          const dbStatus = mapStatusToDb(filters.status);
          if (dbStatus) {
            query = query.eq('status', dbStatus);
          }
        }
        
        if (filters.dateFrom) {
          query = query.gte('scheduled_date', filters.dateFrom);
        }
        
        if (filters.dateTo) {
          query = query.lte('scheduled_date', filters.dateTo);
        }
        
        const { data, error } = await query.order('scheduled_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching maintenance records:', error);
          toast({
            title: "Error",
            description: "Failed to load maintenance records",
            variant: "destructive"
          });
          return [];
        }
        
        // Normalize all records to ensure consistent format
        return data?.map(normalizeMaintenanceRecord) || [];
      } catch (error) {
        console.error('Error in maintenance query:', error);
        return [];
      }
    },
    getById: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        return normalizeMaintenanceRecord(data);
      } catch (error) {
        console.error('Error fetching maintenance by ID:', error);
        throw error;
      }
    },
    create: async (data: any) => {
      try {
        const { data: newRecord, error } = await supabase
          .from('maintenance')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return normalizeMaintenanceRecord(newRecord);
      } catch (error) {
        console.error('Error creating maintenance record:', error);
        throw error;
      }
    },
    update: async (id: string, data: any) => {
      try {
        const { data: updatedRecord, error } = await supabase
          .from('maintenance')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return normalizeMaintenanceRecord(updatedRecord);
      } catch (error) {
        console.error('Error updating maintenance record:', error);
        throw error;
      }
    },
    delete: async (id: string) => {
      try {
        const { error } = await supabase
          .from('maintenance')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        throw error;
      }
    }
  };

  // Use the CRUD API helper from use-api.ts
  const crudApi = {
    getAll: useApiQuery(['maintenance', JSON.stringify(filters)], maintenanceEndpoints.getAll),
    getById: (id: string) => useApiQuery(['maintenance', id], () => maintenanceEndpoints.getById(id)),
    create: useApiMutation(maintenanceEndpoints.create, { 
      successMessage: 'Maintenance record created successfully' 
    }),
    update: useApiMutation(
      ({ id, data }: { id: string; data: any }) => maintenanceEndpoints.update(id, data),
      { successMessage: 'Maintenance record updated successfully' }
    ),
    remove: useApiMutation(maintenanceEndpoints.delete, { 
      successMessage: 'Maintenance record deleted successfully' 
    })
  };

  // Create a direct method to fetch maintenance by vehicle ID
  const getMaintenanceByVehicleId = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle maintenance:', error);
        return [];
      }
      
      // Normalize all records to ensure consistent format
      return data?.map(normalizeMaintenanceRecord) || [];
    } catch (error) {
      console.error('Error in getMaintenanceByVehicleId:', error);
      return [];
    }
  };

  // Create a custom useList function that addresses the ambiguous column issue
  const useCustomList = (customFilters?: any) => {
    return useApiQuery(
      ['maintenance-list', JSON.stringify(customFilters)],
      async () => {
        try {
          let query = supabase.from('maintenance').select('*');
          
          if (customFilters) {
            // Handle vehicle_id filtering
            if (customFilters.vehicle_id) {
              query = query.eq('vehicle_id', customFilters.vehicle_id);
            }
            
            // Handle status filtering
            if (customFilters.status) {
              query = query.eq('status', customFilters.status);
            }
            
            // Handle date range filtering
            if (customFilters.date_from) {
              const dateFrom = new Date(customFilters.date_from);
              query = query.gte('scheduled_date', dateFrom.toISOString());
            }
            
            if (customFilters.date_to) {
              const dateTo = new Date(customFilters.date_to);
              query = query.lte('scheduled_date', dateTo.toISOString());
            }
            
            // Handle maintenance type filtering
            if (customFilters.maintenance_type) {
              query = query.eq('maintenance_type', customFilters.maintenance_type);
            }
            
            // Handle text search across multiple fields
            if (customFilters.query) {
              const searchTerm = `%${customFilters.query}%`;
              query = query.or(`description.ilike.${searchTerm}`);
            }
          }
          
          // Order by scheduled date, newest first
          const { data, error } = await query.order('scheduled_date', { ascending: false });
          
          if (error) {
            console.error('Error fetching maintenance records in useCustomList:', error);
            toast({
              title: "Error",
              description: "Failed to load maintenance records",
              variant: "destructive"
            });
            return [];
          }
          
          // Normalize all records to ensure consistent format 
          const normalizedData = data?.map(normalizeMaintenanceRecord) || [];
          
          return normalizedData;
        } catch (error) {
          console.error('Error in useCustomList query:', error);
          return [];
        }
      }
    );
  };

  // Wrap the useOne hook to properly handle date fields and field normalization
  const useOneWithNormalization = (id?: string) => {
    if (!id) return { data: undefined, isLoading: false, error: null };
    return crudApi.getById(id);
  };

  // Function to delete all maintenance records, handling foreign key constraints
  const deleteAllRecords = async () => {
    try {
      // First, check if there are any vehicle inspections referencing maintenance records
      const { data: inspections, error: inspectionError } = await supabase
        .from('vehicle_inspections')
        .select('maintenance_id')
        .not('maintenance_id', 'is', null);
      
      if (inspectionError) {
        console.error('Error checking vehicle inspections:', inspectionError);
        toast({
          title: "Error",
          description: "Failed to check related inspection records",
          variant: "destructive"
        });
        return false;
      }
      
      // If there are related inspections, we need to handle them first
      if (inspections && inspections.length > 0) {
        // First, update the vehicle_inspections to remove the maintenance_id references
        const { error: updateError } = await supabase
          .from('vehicle_inspections')
          .update({ maintenance_id: null })
          .not('maintenance_id', 'is', null);
        
        if (updateError) {
          console.error('Error updating vehicle inspections:', updateError);
          toast({
            title: "Error",
            description: "Failed to update related inspection records",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Now we can safely delete all maintenance records
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .filter('id', 'not.is', null);
      
      if (error) {
        console.error('Error deleting all maintenance records:', error);
        toast({
          title: "Error",
          description: "Failed to delete maintenance records",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "All maintenance records have been deleted",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Error in deleteAllRecords:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Return both the basic state and the CRUD operations
  return {
    // Basic state
    maintenanceRecords: crudApi.getAll.data,
    isLoading: crudApi.getAll.isLoading,
    filters,
    setFilters,
    refetch: crudApi.getAll.refetch,
    
    // Direct methods
    getMaintenanceByVehicleId,
    deleteAllRecords,
    
    // CRUD operations
    useList: useCustomList,
    useOne: useOneWithNormalization,
    useCreate: crudApi.create,
    useUpdate: crudApi.update,
    useDelete: crudApi.remove
  };
}
