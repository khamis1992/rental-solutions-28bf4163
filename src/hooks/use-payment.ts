
import { usePaymentService } from './services/usePaymentService';
import { useQuery } from '@tanstack/react-query';
import { usePaymentSchedule } from './payment/use-payment-schedule';
import type { Payment, SpecialPaymentOptions } from '@/types/payment.types';

export function usePayment(agreementId?: string) {
  const {
    payments,
    isLoading,
    error,
    recordPayment,
    updatePayment,
    deletePayment,
    handleSpecialPayment,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalPaymentStatuses,
    isPending
  } = usePaymentService(agreementId);

  // Get payment schedule functionality from the new hook
  const {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: isSchedulePending
  } = usePaymentSchedule();

  const { data: paymentHistory } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => payments,
    enabled: !!agreementId,
  });

  // Simplified wrapper for handleSpecialPayment
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
    return handleSpecialPayment({
      agreementId,
      amount,
      paymentDate,
      options
    });
  };

  // Function to update all historical payments to 'completed' status
  const updateHistoricalStatuses = async () => {
    if (!agreementId) return { updatedCount: 0 };
    
    // Use September 1, 2024 as the cutoff date
    const cutoffDate = new Date(2024, 8, 1); // Month is 0-indexed, so 8 is September
    
    return updateHistoricalPaymentStatuses({
      agreementId, 
      cutoffDate
    });
  };

  // Generate payment for the current agreement
  const generatePaymentSchedule = async () => {
    if (!agreementId) return false;
    
    return generatePayment(agreementId);
  };

  // Run maintenance job for all agreements
  const runPaymentMaintenance = async () => {
    return runMaintenanceJob();
  };

  return {
    payments: paymentHistory,
    isLoading,
    error,
    recordPayment,
    updatePayment,
    deletePayment,
    handlePaymentSubmit,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalStatuses,
    // New functionality from payment schedule hook
    generatePaymentSchedule,
    runPaymentMaintenance,
    fixPaymentAnomalies,
    isPending: {
      ...isPending,
      generatePayment: isSchedulePending.generatePayment,
      runMaintenance: isSchedulePending.runMaintenanceJob,
      fixAnomalies: isSchedulePending.fixPaymentAnomalies
    }
  };
}
