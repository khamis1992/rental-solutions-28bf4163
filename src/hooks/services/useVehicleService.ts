
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService, VehicleFilterParams } from '@/services/VehicleService';
import { toast } from 'sonner';
import { useState } from 'react';

interface UseVehicleServiceOptions {
  statuses?: string[];
  status?: string;
  search?: string;
  [key: string]: any;
}

export const useVehicleService = (options: UseVehicleServiceOptions = {}) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<VehicleFilterParams>(options);

  const getVehiclesByStatus = useQuery({
    queryKey: ['vehicles', 'by-status', filters],
    queryFn: async () => {
      const result = await vehicleService.getVehiclesByStatus();
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 
                           result.error?.toString() || 'Failed to fetch vehicles by status';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const findVehicles = useQuery({
    queryKey: ['vehicles', 'filtered', filters],
    queryFn: async () => {
      const result = await vehicleService.findVehicles(filters);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 
                           result.error?.toString() || 'Failed to fetch vehicles';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const availableVehicles = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: async () => {
      const result = await vehicleService.findAvailableVehicles();
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 
                           result.error?.toString() || 'Failed to fetch available vehicles';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const vehicleTypes = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const result = await vehicleService.getVehicleTypes();
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 
                           result.error?.toString() || 'Failed to fetch vehicle types';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const updateVehicleStatus = useMutation({
    mutationFn: async ({ vehicleId, status, notes }: { vehicleId: string; status: string; notes?: string }) => {
      const result = await vehicleService.updateVehicleStatus(vehicleId, status, notes);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 
                           result.error?.toString() || 'Failed to update vehicle status';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Vehicle status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update vehicle status: ${errorMessage}`);
    }
  });

  const getVehicleDetails = async (id: string) => {
    const result = await vehicleService.getVehicleDetails(id);
    if (!result.success) {
      const errorMessage = typeof result.error === 'string' ? result.error : 
                         result.error?.toString() || 'Failed to fetch vehicle details';
      throw new Error(errorMessage);
    }
    return result.data;
  };

  const updateVehicle = async (id: string, data: any) => {
    // Implementation would use vehicleService.updateVehicle if available
    throw new Error('updateVehicle not implemented');
  };

  const updateStatus = async (id: string, status: string) => {
    const result = await vehicleService.updateStatus(id, status);
    if (!result.success) {
      const errorMessage = typeof result.error === 'string' ? result.error : 
                         result.error?.toString() || 'Failed to update vehicle status';
      throw new Error(errorMessage);
    }
    return result.data;
  };

  const deleteVehicle = async (id: string) => {
    // Implementation would use vehicleService.deleteVehicle if available
    throw new Error('deleteVehicle not implemented');
  };

  const calculateUtilization = async (vehicleId: string, startDate: Date, endDate: Date) => {
    const result = await vehicleService.calculateUtilizationMetrics(vehicleId, startDate, endDate);
    if (!result.success) {
      const errorMessage = typeof result.error === 'string' ? result.error : 
                         result.error?.toString() || 'Failed to calculate utilization';
      throw new Error(errorMessage);
    }
    return result.data;
  };

  return {
    // Query results
    getVehiclesByStatus,
    vehicles: findVehicles.data?.data || getVehiclesByStatus.data || [],
    isLoading: getVehiclesByStatus.isLoading || findVehicles.isLoading,
    error: getVehiclesByStatus.error || findVehicles.error,
    
    // Filters
    filters,
    setFilters,
    
    // Additional queries
    vehicleTypes: vehicleTypes.data || [],
    availableVehicles: availableVehicles.data || [],
    
    // Methods
    getVehicleDetails,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
    
    // Mutations
    updateVehicleStatus: updateVehicleStatus.mutateAsync,
    isPending: {
      updateVehicleStatus: updateVehicleStatus.isPending
    }
  };
};
