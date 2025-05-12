
import { usePaymentService } from './services/usePaymentService';
import { useQuery } from '@tanstack/react-query';
import type { Payment } from '@/types/agreement-types';

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
    updateHistoricalPaymentStatuses
  } = usePaymentService(agreementId);

  const { data: paymentHistory } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => payments,
    enabled: !!agreementId,
  });

  // Simplified wrapper for handleSpecialPayment that accepts consistent parameters
  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => {
    if (!agreementId) return false;

    // Create options object for additional parameters
    const options = {
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment
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
    updateHistoricalStatuses
  };
}
