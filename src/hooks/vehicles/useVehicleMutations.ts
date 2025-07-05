import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VehicleService } from '@/services/VehicleService';
import { ExtendedVehicle, VehicleInsert, VehicleUpdate } from '@/types/vehicle';

const vehicleService = new VehicleService();

export function useVehicleMutations() {
  const queryClient = useQueryClient();

  const createVehicleMutation = useMutation({
    mutationFn: (vehicle: VehicleInsert) => vehicleService.createVehicle(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vehicle: ${error.message}`);
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, vehicle }: { id: string; vehicle: VehicleUpdate }) =>
      vehicleService.updateVehicle(id, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => vehicleService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete vehicle: ${error.message}`);
    }
  });

  return {
    useCreate: () => createVehicleMutation,
    useUpdate: () => updateVehicleMutation,
    useDelete: () => deleteVehicleMutation,
    createVehicle: createVehicleMutation.mutate,
    updateVehicle: updateVehicleMutation.mutate,
    deleteVehicle: deleteVehicleMutation.mutate,
    isCreating: createVehicleMutation.isPending,
    isUpdating: updateVehicleMutation.isPending,
    isDeleting: deleteVehicleMutation.isPending
  };
}
