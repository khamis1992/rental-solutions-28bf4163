
import { usePaymentService } from './services/usePaymentService';
import { useQuery } from '@tanstack/react-query';
import { Payment } from '@/types/payment.types';
import { safeAsync } from '@/utils/error-handling';

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

  const handlePaymentSubmit = async (params: PaymentSubmitParams): Promise<void> => {
    if (!agreementId) return;

    const {
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment
    } = params;

    // Using safeAsync for better error handling
    const { error } = await safeAsync(
      handleSpecialPayment(
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
      ), 
      (err) => console.error("Payment submission failed:", err)
    );

    if (error) {
      throw error; // Re-throw to allow caller to handle the error
    }
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
