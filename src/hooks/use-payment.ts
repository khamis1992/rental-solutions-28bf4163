
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

  // Implement handlePaymentSubmit for backwards compatibility
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

    try {
      await paymentManagement.addPayment({
        lease_id: agreementId,
        amount,
        payment_date: paymentDate.toISOString(),
        notes: notes || '',
        payment_method: paymentMethod || 'cash',
        reference_number: referenceNumber || '',
        status: 'completed'
      });
      return true;
    } catch (error) {
      console.error("Error submitting payment:", error);
      return false;
    }
  };

  return {
    ...paymentManagement,
    payments: paymentHistory,
    handlePaymentSubmit,
  };
}
