
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService, VehicleFilterParams } from '@/services/VehicleService';
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
      try {
        const { data } = await vehicleService.findVehicles(filters);
        return data;
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to fetch vehicles');
      }
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
      try {
        return await vehicleService.getVehicleTypes();
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to fetch vehicle types');
      }
    },
    staleTime: 3600000, // 1 hour
  });

  // Mutation for getting vehicle details
  const getVehicleDetails = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await vehicleService.getVehicleDetails(id);
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to fetch vehicle details');
      }
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
      try {
        return await vehicleService.findAvailableVehicles();
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to fetch available vehicles');
      }
    },
    staleTime: 300000, // 5 minutes
  });

  // Mutation for updating a vehicle
  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      try {
        return await vehicleService.updateVehicle(id, data);
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to update vehicle');
      }
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
      try {
        return await vehicleService.updateStatus(id, status);
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to update vehicle status');
      }
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
      try {
        // There is no direct delete by id in the new VehicleService, so use batchDelete
        await vehicleService.batchDelete([id]);
        return id;
      } catch (err) {
        throw new Error((err as Error).message || 'Failed to delete vehicle');
      }
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutations for analytics and maintenance are not implemented in the new VehicleService
  // If needed, implement them in VehicleService and expose here.

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
    // calculateUtilization and getMaintenanceRecords are not implemented in the new VehicleService
    isPending: {
      getVehicleDetails: getVehicleDetails.isPending,
      updateVehicle: updateVehicle.isPending,
      updateStatus: updateStatus.isPending,
      deleteVehicle: deleteVehicle.isPending,
    }
  };
};
