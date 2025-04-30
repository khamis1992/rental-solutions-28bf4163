
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService, VehicleFilterParams } from '@/services/VehicleService';
import { toast } from 'sonner';

/**
 * Hook for working with the Vehicle Service
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
      const result = await vehicleService.findVehicles(filters);
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
      const result = await vehicleService.getVehicleTypes();
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
      const result = await vehicleService.getVehicleDetails(id);
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
      const result = await vehicleService.findAvailableVehicles();
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
      const result = await vehicleService.update(id, data);
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
      const result = await vehicleService.updateStatus(id, status);
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
      const result = await vehicleService.delete(id);
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
      const result = await vehicleService.calculateUtilizationMetrics(id, startDate, endDate);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to calculate utilization');
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
    // Expose isPending states for UI loading indicators
    isPending: {
      getVehicleDetails: getVehicleDetails.isPending,
      updateVehicle: updateVehicle.isPending,
      updateStatus: updateStatus.isPending,
      deleteVehicle: deleteVehicle.isPending,
      calculateUtilization: calculateUtilization.isPending,
    }
  };
};
