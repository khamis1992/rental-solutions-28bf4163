
import { usePaymentManagement } from './payment/use-payment-management';
import { useQuery } from '@tanstack/react-query';
import { SpecialPaymentOptions } from '@/types/payment.types';

export function usePayment(agreementId?: string) {
  // Use the centralized payment management hook
  const paymentManagement = usePaymentManagement(agreementId);
  
  // For backwards compatibility
  const { data: paymentHistory } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => paymentManagement.payments,
    enabled: !!agreementId,
  });

  // Wrap handlePaymentSubmit for backwards compatibility
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

    return paymentManagement.handlePaymentSubmit(
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber,
      includeLatePaymentFee,
      isPartialPayment,
      paymentType
    );
  };

  return {
    ...paymentManagement,
    payments: paymentHistory,
    handlePaymentSubmit,
  };
}
