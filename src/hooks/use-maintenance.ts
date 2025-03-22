
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
    useList: crudApi.useList,
    useOne: crudApi.useItem,
    useCreate: crudApi.useCreate,
    useUpdate: crudApi.useUpdate,
    useDelete: crudApi.useDelete
  };
}
