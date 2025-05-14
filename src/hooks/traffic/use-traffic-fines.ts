
import { useFineDataFetching } from './use-fine-data-fetching';
import { useTrafficFineMutations } from './use-traffic-fine-mutations';
import { UseTrafficFinesResult } from './types';

export function useTrafficFines(agreementId?: string): UseTrafficFinesResult {
  const { 
    fines, 
    setFines, 
    customerData, 
    isLoading, 
    error, 
    fetchFines 
  } = useFineDataFetching(agreementId);

  const {
    markFineAsPaid,
    addNewFine,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    createTrafficFine
  } = useTrafficFineMutations(setFines);

  // For compatibility with existing code
  return {
    fines,
    trafficFines: fines, // For backward compatibility
    customerData,
    isLoading,
    error,
    fetchFines,
    markFineAsPaid,
    addNewFine,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    createTrafficFine // Alias for backward compatibility
  };
}
