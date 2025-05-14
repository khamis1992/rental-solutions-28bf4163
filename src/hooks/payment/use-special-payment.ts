import { useCallback } from 'react';
import { usePayments } from '@/hooks/use-payments';
import { SpecialPaymentOptions } from '@/types/payment-types.unified';
import { toast } from 'sonner';
import { useLoadingStates } from './use-loading-states';

export function useSpecialPayment(agreementId?: string) {
  const { addPayment, updatePayment, fetchPayments } = usePayments(agreementId);
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    processPayment: false,
    calculateLateFee: false,
  });

  const calculateLateFee = useCallback((currentDate: Date) => {
    // Default values
    const daysLate = 0;
    const amount = 0;

    // Logic to calculate late fee based on the current date
    // For now, just return zero - we'll implement this later
    
    return { daysLate, amount };
  }, []);

  const processPayment = useCallback(
    async (amount: number, paymentDate: Date, options: SpecialPaymentOptions = {}) => {
      if (!agreementId) {
        toast.error('Cannot process payment: No agreement ID provided');
        return false;
      }

      setLoading('processPayment');

      try {
        const {
          notes,
          paymentMethod = 'cash',
          referenceNumber,
          includeLatePaymentFee = false,
          isPartialPayment = false,
          paymentType = 'rent',
          targetPaymentId
        } = options;

        // Create the payment object
        const payment = {
          lease_id: agreementId,
          amount,
          payment_date: paymentDate.toISOString(),
          status: 'completed',
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || 'Payment',
          type: paymentType,
        };

        // Update existing payment if targetPaymentId is provided
        if (targetPaymentId) {
          await updatePayment({
            id: targetPaymentId,
            data: payment
          });
        } else {
          // Otherwise create a new payment
          await addPayment(payment);
        }

        fetchPayments();
        setIdle('processPayment');
        return true;
      } catch (error) {
        console.error('Error processing payment:', error);
        toast.error('Failed to process payment');
        setIdle('processPayment');
        return false;
      }
    },
    [agreementId, addPayment, updatePayment, fetchPayments, setLoading, setIdle]
  );

  return {
    processPayment,
    calculateLateFee,
    isPending: loadingStates,
  };
}
