
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
    isPartialPayment?: boolean,
    paymentType?: string
  ) => {
    if (!agreementId) return;

    // Create options object for additional parameters
    const options = {
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      paymentType
    };

    // Pass required parameters and options object
    return handleSpecialPayment(agreementId, amount, paymentDate, options);
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
  };
}
