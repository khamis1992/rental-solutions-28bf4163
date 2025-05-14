
import { useTrafficFines } from '@/hooks/traffic';
import { TrafficFine, TrafficFineCreatePayload } from '@/hooks/traffic/types';

export function useTrafficFineService() {
  const { 
    fines, 
    fetchFines, 
    addNewFine,
    markFineAsPaid,
    payTrafficFine, 
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    isLoading, 
    error 
  } = useTrafficFines();

  const getTrafficFines = async () => {
    await fetchFines();
    return fines;
  };

  const getTrafficFineById = async (id: string) => {
    await fetchFines();
    return fines.find(fine => fine.id === id) || null;
  };

  const createTrafficFine = async (data: TrafficFineCreatePayload) => {
    return await addNewFine(data);
  };

  const updateTrafficFine = async (id: string, updates: Partial<TrafficFine>) => {
    if (updates.payment_status === 'paid') {
      return await markFineAsPaid(id, updates.payment_date || new Date().toISOString());
    }

    if (updates.payment_status === 'disputed') {
      return await disputeTrafficFine.mutateAsync({ id });
    }

    // For other update types, we could implement as needed
    return false;
  };

  return {
    getTrafficFines,
    getTrafficFineById,
    createTrafficFine,
    updateTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    payTrafficFine,
    isLoading,
    error
  };
}
