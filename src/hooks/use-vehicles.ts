
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VehicleService, Vehicle, VehicleFilterParams } from '@/services/vehicles/vehicles-service';

export type { Vehicle } from '@/services/vehicles/vehicles-service';

export const useVehicles = (initialFilters: VehicleFilterParams = {}) => {
  const [filterParams, setFilterParams] = useState<VehicleFilterParams>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching vehicles with filters
  const {
    data: vehicles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vehicles', filterParams],
    queryFn: () => VehicleService.fetchVehicles(filterParams),
    staleTime: 300000, // 5 minutes
    gcTime: 600000,    // 10 minutes
  });

  // Query for fetching a single vehicle
  const fetchVehicle = async (id: string): Promise<Vehicle | null> => {
    return await VehicleService.getVehicle(id);
  };

  // Mutation for creating a new vehicle
  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      const newVehicle = await VehicleService.createVehicle(vehicleData);
      if (!newVehicle) {
        throw new Error('Failed to create vehicle');
      }
      return newVehicle;
    },
    onSuccess: () => {
      toast.success('Vehicle created successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create vehicle: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for updating a vehicle
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updatedVehicle = await VehicleService.updateVehicle(id, data);
      if (!updatedVehicle) {
        throw new Error('Failed to update vehicle');
      }
      return updatedVehicle;
    },
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update vehicle: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for deleting a vehicle
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await VehicleService.deleteVehicle(id);
      if (!success) {
        throw new Error('Failed to delete vehicle');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete vehicle: ${error.message || 'Unknown error'}`);
    }
  });

  // Check if a vehicle is currently assigned to an agreement
  const checkVehicleAssignment = async (vehicleId: string): Promise<{
    isAssigned: boolean;
    agreement?: { id: string; agreement_number: string } | null;
  }> => {
    const agreement = await VehicleService.getVehicleAgreement(vehicleId);
    return {
      isAssigned: !!agreement,
      agreement
    };
  };

  return {
    vehicles,
    isLoading,
    error,
    filterParams,
    setFilterParams,
    fetchVehicle,
    createVehicle: createVehicleMutation.mutateAsync,
    updateVehicle: updateVehicleMutation.mutateAsync,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    checkVehicleAssignment,
    refetchVehicles: refetch
  };
};
