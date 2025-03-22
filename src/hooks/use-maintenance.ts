
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
        
        return data || [];
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
      
      return data || [];
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
              query = query.or(`description.ilike.${searchTerm},service_provider.ilike.${searchTerm},invoice_number.ilike.${searchTerm}`);
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
          
          return data || [];
        } catch (error) {
          console.error('Error in useCustomList query:', error);
          return [];
        }
      }
    );
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
    
    // CRUD operations
    useList: useCustomList,
    useOne: crudApi.useItem,
    useCreate: crudApi.useCreate,
    useUpdate: crudApi.useUpdate,
    useDelete: crudApi.useDelete
  };
}
