
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  vehicleInventoryService, 
  vehicleAnalyticsService, 
  vehicleMaintenanceService,
  VehicleFilterParams
} from '@/services/vehicles';
import { toast } from 'sonner';

/**
 * Hook for working with the Vehicle Services
 */
export const useVehicleService = (initialFilters: VehicleFilterParams = {}) => {
  const [filters, setFilters] = useState<VehicleFilterParams>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching vehicles with filters
  const {
    data: vehicles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      const result = await vehicleInventoryService.findVehicles(filters);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch vehicles');
      }
      return result.data;
    },
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes
  });

  // Query for vehicle types
  const {
    data: vehicleTypes = [],
    isLoading: isLoadingVehicleTypes
  } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const result = await vehicleInventoryService.getVehicleTypes();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch vehicle types');
      }
      return result.data;
    },
    staleTime: 3600000, // 1 hour
  });

  // Mutation for getting vehicle details
  const getVehicleDetails = useMutation({
    mutationFn: async (id: string) => {
      const result = await vehicleInventoryService.getVehicleDetails(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch vehicle details');
      }
      return result.data;
    }
  });

  // Query for available vehicles
  const {
    data: availableVehicles = [],
    isLoading: isLoadingAvailable,
    refetch: refetchAvailable
  } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: async () => {
      const result = await vehicleInventoryService.findAvailableVehicles();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch available vehicles');
      }
      return result.data;
    },
    staleTime: 300000, // 5 minutes
  });

  // Mutation for updating a vehicle
  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const result = await vehicleInventoryService.update(id, data);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update vehicle');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for updating vehicle status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await vehicleInventoryService.updateStatus(id, status);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update vehicle status');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for deleting a vehicle
  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const result = await vehicleInventoryService.delete(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete vehicle');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for calculating vehicle utilization
  const calculateUtilization = useMutation({
    mutationFn: async ({ 
      id, 
      startDate, 
      endDate 
    }: { 
      id: string; 
      startDate: Date; 
      endDate: Date 
    }) => {
      const result = await vehicleAnalyticsService.calculateUtilizationMetrics(id, startDate, endDate);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to calculate utilization');
      }
      return result.data;
    }
  });

  // Get vehicle maintenance records
  const getMaintenanceRecords = useMutation({
    mutationFn: async (vehicleId: string) => {
      const result = await vehicleMaintenanceService.getMaintenanceRecords(vehicleId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch maintenance records');
      }
      return result.data;
    }
  });

  return {
    vehicles,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    vehicleTypes,
    isLoadingVehicleTypes,
    availableVehicles,
    isLoadingAvailable,
    refetchAvailable,
    getVehicleDetails: getVehicleDetails.mutateAsync,
    updateVehicle: updateVehicle.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    deleteVehicle: deleteVehicle.mutateAsync,
    calculateUtilization: calculateUtilization.mutateAsync,
    getMaintenanceRecords: getMaintenanceRecords.mutateAsync,
    // Expose isPending states for UI loading indicators
    isPending: {
      getVehicleDetails: getVehicleDetails.isPending,
      updateVehicle: updateVehicle.isPending,
      updateStatus: updateStatus.isPending,
      deleteVehicle: deleteVehicle.isPending,
      calculateUtilization: calculateUtilization.isPending,
      getMaintenanceRecords: getMaintenanceRecords.isPending,
    }
  };
};
