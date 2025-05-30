import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/VehicleService';
import { Vehicle } from '@/types/vehicle';
import { toast } from 'sonner';
import { toVehicleStatus } from '@/lib/type-helpers';
import { getErrorMessage } from '@/types/service.types';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const queryClient = useQueryClient();

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) throw new Error('Vehicle ID is required');
      const result = await vehicleService.getVehicleById(vehicleId);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (updatedVehicle: Partial<Vehicle>) => {
      if (!vehicleId) throw new Error('Vehicle ID is required');
      const vehicleData = {
        ...updatedVehicle,
        ...(typeof updatedVehicle.status === 'string' ? { status: toVehicleStatus(updatedVehicle.status) as Vehicle['status'] } : {})
      };
      const result = await vehicleService.updateVehicle(vehicleId, vehicleData);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating vehicle:', error);
      toast.error('Failed to update vehicle');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error('Vehicle ID is required');
      const result = await vehicleService.deleteVehicle(vehicleId);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    },
  });

  // Fix the status assignment with proper type casting
  const vehicle = vehicleQuery.data ? {
    ...vehicleQuery.data,
    status: toVehicleStatus(vehicleQuery.data.status || 'available')
  } : null;

  return {
    vehicle,
    isLoading: vehicleQuery.isLoading,
    error: vehicleQuery.error,
    updateVehicle: updateVehicleMutation.mutate,
    deleteVehicle: deleteVehicleMutation.mutate,
    isUpdating: updateVehicleMutation.isPending,
    isDeleting: deleteVehicleMutation.isPending,
  };
};
