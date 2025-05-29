
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/VehicleService';
import { toast } from 'sonner';

export const useVehicleService = () => {
  const queryClient = useQueryClient();

  const getVehiclesByStatus = useQuery({
    queryKey: ['vehicles', 'by-status'],
    queryFn: async () => {
      const result = await vehicleService.getVehiclesByStatus();
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.toString() || 'Failed to fetch vehicles by status';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const updateVehicleStatus = useMutation({
    mutationFn: async ({ vehicleId, status, notes }: { vehicleId: string; status: string; notes?: string }) => {
      const result = await vehicleService.updateVehicleStatus(vehicleId, status, notes);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.toString() || 'Failed to update vehicle status';
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

  return {
    getVehiclesByStatus,
    updateVehicleStatus: updateVehicleStatus.mutateAsync,
    isPending: {
      updateVehicleStatus: updateVehicleStatus.isPending
    }
  };
};
