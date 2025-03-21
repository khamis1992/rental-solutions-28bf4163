import { useApiMutation, useApiQuery } from './use-api';
import { useState } from 'react';
import { useToast } from './use-toast';

export type MaintenanceStatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Function to map frontend status to database status
const mapStatusToDb = (status: string | undefined): MaintenanceStatusType | undefined => {
  if (!status || status === 'all') return undefined;
  
  // Ensure we're only returning valid status types
  const validStatuses: MaintenanceStatusType[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
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

  // When using filters in a query, map the status to the proper type
  const { data: maintenanceRecords, isLoading, refetch } = useApiQuery(
    ['maintenance', filters],
    async () => {
      // When using the status filter, ensure it's properly typed
      const dbStatus = mapStatusToDb(filters.status);
      
      // Here we would use the dbStatus in the API call
      // For example: api.getMaintenance({ status: dbStatus })
      
      return []; // Placeholder for actual API response
    }
  );

  // Rest of the hook implementation...
  
  return {
    maintenanceRecords,
    isLoading,
    filters,
    setFilters,
    // Other returned values...
  };
}
