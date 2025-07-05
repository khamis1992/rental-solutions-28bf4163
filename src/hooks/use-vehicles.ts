import { useVehicleConnectionStatus } from './vehicles/useVehicleConnectionStatus';
import { useVehicleTypes } from './vehicles/useVehicleTypes';
import { useVehicleQueries } from './vehicles/useVehicleQueries';
import { useVehicleMutations } from './vehicles/useVehicleMutations';

export const useVehicles = () => {
  const connectionHooks = useVehicleConnectionStatus();
  const typesHook = useVehicleTypes();
  const queryHooks = useVehicleQueries();
  const mutationHooks = useVehicleMutations();

  return {
    // Connection status
    connectionStatus: connectionHooks.connectionStatus,
    isHealthy: connectionHooks.isHealthy,
    
    // Vehicle types
    useVehicleTypes: () => typesHook,
    
    // Queries
    useList: queryHooks.useList,
    useVehicle: queryHooks.useVehicle,
    useRealtimeUpdates: queryHooks.useRealtimeUpdates,
    
    // Mutations - return the functions directly
    createVehicle: mutationHooks.createVehicle,
    updateVehicle: mutationHooks.updateVehicle,
    deleteVehicle: mutationHooks.deleteVehicle,
    isCreating: mutationHooks.isCreating,
    isUpdating: mutationHooks.isUpdating,
    isDeleting: mutationHooks.isDeleting,
  };
}; 