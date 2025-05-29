
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
    useConnectionStatus: connectionHooks.useConnectionStatus,
    
    // Vehicle types
    useVehicleTypes: () => typesHook,
    
    // Queries
    useList: queryHooks.useList,
    useVehicle: queryHooks.useVehicle,
    useRealtimeUpdates: queryHooks.useRealtimeUpdates,
    
    // Mutations
    useCreate: mutationHooks.useCreate,
    useUpdate: mutationHooks.useUpdate,
    useDelete: mutationHooks.useDelete,
  };
};
