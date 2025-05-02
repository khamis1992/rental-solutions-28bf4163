
import { useTrafficFinesQuery, TrafficFine, TrafficFineStatusType } from './use-traffic-fines-query';
import { useTrafficFineMutations, TrafficFinePayload, TrafficFineCreatePayload } from './use-traffic-fine-mutations';
import { useTrafficFineCleanup } from './use-traffic-fine-cleanup';

/**
 * Main traffic fines hook that combines query, mutations, and cleanup functionality
 */
export function useTrafficFines() {
  const { data: trafficFines, isLoading, error } = useTrafficFinesQuery();
  const { createTrafficFine, assignToCustomer, payTrafficFine, disputeTrafficFine } = useTrafficFineMutations();
  const { cleanupInvalidAssignments } = useTrafficFineCleanup(trafficFines);

  return {
    trafficFines,
    isLoading,
    error,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine,
    createTrafficFine,
    cleanupInvalidAssignments
  };
}

export type {
  TrafficFine,
  TrafficFineStatusType,
  TrafficFinePayload,
  TrafficFineCreatePayload
};
