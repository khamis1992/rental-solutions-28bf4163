import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleService, VehicleFilterParams, vehicleService } from '@/services/VehicleService';
import { Vehicle } from '@/types/vehicle.types';
import { toast } from 'sonner';
import { getErrorMessage, ServiceResult } from '@/types/service.types';

interface UseVehicleServiceOptions {
  filters?: VehicleFilterParams;
}

export function useVehicleService(options: UseVehicleServiceOptions = {}) {
  const queryClient = useQueryClient();

  const listVehicles = useCallback(async () => {
    try {
      const result = await vehicleService.getVehicles(options.filters);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch vehicles: ${errorMessage}`);
      throw error;
    }
  }, [options.filters]);

  const getVehicle = useCallback(async (id: string) => {
    try {
      const result = await vehicleService.getVehicleById(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch vehicle: ${errorMessage}`);
      throw error;
    }
  }, []);

  const createVehicle = useCallback(async (data: Partial<Vehicle>) => {
    try {
      const result = await vehicleService.createVehicle(data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to create vehicle: ${errorMessage}`);
      throw error;
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    try {
      const result = await vehicleService.updateVehicle(id, data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to update vehicle: ${errorMessage}`);
      throw error;
    }
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      const result = await vehicleService.deleteVehicle(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to delete vehicle: ${errorMessage}`);
      throw error;
    }
  }, []);

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', options.filters],
    queryFn: listVehicles,
  });

  const createVehicleMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully');
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
  });

  return {
    vehicles,
    isLoadingVehicles,
    createVehicle: createVehicleMutation.mutate,
    updateVehicle: updateVehicleMutation.mutate,
    deleteVehicle: deleteVehicleMutation.mutate,
    getVehicle,
  };
}
