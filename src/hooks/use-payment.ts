
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

  const handlePaymentSubmit = async (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => {
    if (!agreementId) return;

    await handleSpecialPayment(
      agreementId, 
      amount, 
      paymentDate, 
      {
        notes,
        paymentMethod,
        referenceNumber,
        includeLatePaymentFee,
        isPartialPayment,
      }
    );
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
