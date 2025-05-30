
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/VehicleService';
import { Vehicle } from '@/types/vehicle';
import { toast } from 'sonner';
import { toVehicleStatus } from '@/lib/type-helpers';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const queryClient = useQueryClient();

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => {
      if (!vehicleId) throw new Error('Vehicle ID is required');
      return vehicleService.getVehicleById(vehicleId);
    },
    enabled: !!vehicleId,
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (updatedVehicle: Partial<Vehicle>) => {
      if (!vehicleId) throw new Error('Vehicle ID is required');
      
      // Convert status to proper type if provided
      const vehicleData = {
        ...updatedVehicle,
        status: updatedVehicle.status ? toVehicleStatus(updatedVehicle.status) : undefined
      };
      
      return vehicleService.updateVehicle(vehicleId, vehicleData);
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
      return vehicleService.deleteVehicle(vehicleId);
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
