
import { useTrafficFinesQuery, TrafficFine, TrafficFineStatusType } from './use-traffic-fines-query';
import { useTrafficFineMutations, TrafficFinePayload, TrafficFineCreatePayload } from './use-traffic-fine-mutations';
import { useTrafficFineCleanup } from './use-traffic-fine-cleanup';
import { useBatchValidation } from './use-batch-validation';

/**
 * Main traffic fines hook that combines query, mutations, and cleanup functionality
 */
export function useTrafficFines() {
  const { data: trafficFines, isLoading, error } = useTrafficFinesQuery();
  const { createTrafficFine, assignToCustomer, payTrafficFine, disputeTrafficFine } = useTrafficFineMutations();
  const { cleanupInvalidAssignments, bulkProcessFines, isValidFine } = useTrafficFineCleanup(trafficFines);
  const { validateBatch, processBatchOperations } = useBatchValidation();

  return {
    trafficFines,
    isLoading,
    error,
    assignToCustomer,
    payTrafficFine,
    disputeTrafficFine,
    createTrafficFine,
    cleanupInvalidAssignments,
    bulkProcessFines,
    isValidFine,
    validateBatch,
    processBatchOperations
  };
}

export type {
  TrafficFine,
  TrafficFineStatusType,
  TrafficFinePayload,
  TrafficFineCreatePayload
};

// Export batch validation hook separately for direct use
export { useBatchValidation, BatchValidationOptions, BatchValidationResults } from './use-batch-validation';
