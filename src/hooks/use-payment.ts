
import { usePaymentService } from './services/usePaymentService';
import { useQuery } from '@tanstack/react-query';
import { Payment } from '@/types/payment.types';

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

  interface PaymentSubmitParams {
    amount: number;
    paymentDate: Date;
    notes?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    includeLatePaymentFee?: boolean;
    isPartialPayment?: boolean;
  }

  const handlePaymentSubmit = async ({
    amount,
    paymentDate,
    notes,
    paymentMethod,
    referenceNumber,
    includeLatePaymentFee,
    isPartialPayment
  }: PaymentSubmitParams): Promise<void> => {
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
    payments: paymentHistory as Payment[] | undefined,
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
