
import { usePaymentService } from './services/usePaymentService';
import { useQuery } from '@tanstack/react-query';
import { usePaymentSchedule } from './payment/use-payment-schedule';
import type { Payment, SpecialPaymentOptions } from '@/types/payment.types';
import { useLoadingStates } from './use-loading-states';

export function usePayment(agreementId?: string) {
  const {
    payments,
    isLoading: isDataLoading,
    error,
    recordPayment,
    updatePayment,
    deletePayment,
    handleSpecialPayment,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalPaymentStatuses,
    isPending: serviceIsPending
  } = usePaymentService(agreementId);

  // Get payment schedule functionality from the schedule hook
  const {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: scheduleIsPending
  } = usePaymentSchedule();

  // Consolidated loading states
  const { loadingStates, setLoading, wrapWithLoading, isAnyLoading } = useLoadingStates({
    ...serviceIsPending,
    generatePayment: scheduleIsPending.generatePayment,
    runMaintenance: scheduleIsPending.runMaintenanceJob,
    fixAnomalies: scheduleIsPending.fixPaymentAnomalies
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => payments,
    enabled: !!agreementId,
  });

  // Wrap functions with loading state management
  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string
  ) => {
    if (!agreementId) return false;

    setLoading('handleSpecialPayment', true);
    try {
      // Create options object for additional parameters
      const options: SpecialPaymentOptions = {
        notes,
        paymentMethod,
        referenceNumber,
        includeLatePaymentFee,
        isPartialPayment,
        paymentType
      };

      // Pass required parameters and options object
      return await handleSpecialPayment({
        agreementId,
        amount,
        paymentDate,
        options
      });
    } finally {
      setLoading('handleSpecialPayment', false);
    }
  };

  // Function to update all historical payments to 'completed' status
  const updateHistoricalStatuses = wrapWithLoading('updateHistoricalStatuses', 
    async () => {
      if (!agreementId) return { updatedCount: 0 };
      
      // Use September 1, 2024 as the cutoff date
      const cutoffDate = new Date(2024, 8, 1); // Month is 0-indexed, so 8 is September
      
      return updateHistoricalPaymentStatuses({
        agreementId, 
        cutoffDate
      });
    }
  );

  // Generate payment for the current agreement
  const generatePaymentSchedule = wrapWithLoading('generatePaymentSchedule',
    async () => {
      if (!agreementId) return false;
      return generatePayment(agreementId);
    }
  );

  // Run maintenance job for all agreements
  const runPaymentMaintenance = wrapWithLoading('runPaymentMaintenance',
    async () => {
      return runMaintenanceJob();
    }
  );

  return {
    payments: paymentHistory,
    isLoading: isDataLoading,
    error,
    recordPayment,
    updatePayment,
    deletePayment,
    handlePaymentSubmit,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalStatuses,
    generatePaymentSchedule,
    runPaymentMaintenance,
    fixPaymentAnomalies,
    // Return consolidated loading states
    loadingStates,
    isAnyLoading
  };
}
