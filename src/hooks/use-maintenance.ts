import { useApiMutation, useApiQuery, useCrudApi } from './use-api';
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

  // Use the CRUD API helper from use-api.ts
  const crudApi = useCrudApi<any>('maintenance');

  // When using filters in a query, map the status to the proper type
  const { data: maintenanceRecords, isLoading, refetch } = useApiQuery(
    ['maintenance', JSON.stringify(filters)],
    async () => {
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
    }
  );

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
    const result = crudApi.useItem(id);
    
    // If we have data, normalize it to ensure consistency
    if (result.data) {
      const normalizedData = normalizeMaintenanceRecord(result.data);
      return {
        ...result,
        data: normalizedData
      };
    }
    
    return result;
  };

  // New function to delete all maintenance records
  const deleteAllRecords = async () => {
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .neq('id', '0'); // This will delete all records
      
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
      return false;
    }
  };

  // Return both the basic state and the CRUD operations
  return {
    // Basic state
    maintenanceRecords,
    isLoading,
    filters,
    setFilters,
    refetch,
    
    // Direct methods
    getMaintenanceByVehicleId,
    deleteAllRecords,
    
    // CRUD operations
    useList: useCustomList,
    useOne: useOneWithNormalization,
    useCreate: crudApi.useCreate,
    useUpdate: crudApi.useUpdate,
    useDelete: crudApi.useDelete
  };
}
