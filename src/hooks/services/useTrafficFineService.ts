
import { useTrafficFineAdapter } from '@/hooks/adapters/use-traffic-fine-adapter';
import { TrafficFine } from '@/types/traffic-fine.types';

export function useTrafficFineService() {
  const { 
    trafficFines: fines, 
    addNewFine,
    payTrafficFine, 
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
    isLoading, 
    error 
  } = useTrafficFineAdapter();
  
  const getTrafficFines = async (options: { leaseId?: string, vehicleId?: string, page?: number, pageSize?: number } = {}) => {
    try {
      // For simplicity, we'll return fines as is
      // In a real implementation, we would filter based on options and paginate
      return {
        data: fines || [],
        meta: {
          totalPages: 1,
          currentPage: options.page || 1,
          totalItems: fines?.length || 0
        }
      };
    } catch (err) {
      console.error("Error in getTrafficFines:", err);
      return { data: [], meta: { totalPages: 1, currentPage: 1, totalItems: 0 } };
    }
  };

  const getTrafficFineById = async (id: string) => {
    return fines.find(fine => fine.id === id) || null;
  };

  const createTrafficFine = async (data: Partial<TrafficFine>) => {
    return await addNewFine(data);
  };

  const markFineAsPaid = async (id: string, paymentDate: string) => {
    try {
      return await payTrafficFine.mutateAsync({ 
        id, 
        paymentDetails: { payment_date: paymentDate } 
      });
    } catch (error) {
      console.error("Error marking fine as paid:", error);
      return false;
    }
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
    markFineAsPaid,
    assignToCustomer,
    cleanupInvalidAssignments,
    payTrafficFine,
    isLoading,
    error
  };
}
