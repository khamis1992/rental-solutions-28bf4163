
import { usePaymentManagement } from './payment/use-payment-management';
import { useQuery } from '@tanstack/react-query';
import { SpecialPaymentOptions } from '@/types/payment.types';
import { usePaymentSchedule } from './payment/use-payment-schedule';
import { isValidUuid } from '@/types/db';

export function usePayment(agreementId?: string) {
  console.log('usePayment called with agreementId:', agreementId);
  
  // Validate agreement ID
  const isValidAgreementId = agreementId && 
    agreementId !== 'undefined' && 
    agreementId !== 'null' && 
    isValidUuid(agreementId);

  console.log('usePayment - isValidAgreementId:', isValidAgreementId);

  // Use the centralized payment management hook
  const paymentManagement = usePaymentManagement(agreementId);
  
  // Use the payment schedule hook for generatePayment functionality
  const paymentSchedule = usePaymentSchedule();
  
  // For backwards compatibility
  const { data: paymentHistory } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: () => paymentManagement.payments,
    enabled: isValidAgreementId,
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
    console.log('usePayment.handlePaymentSubmit called with:', {
      agreementId,
      amount,
      paymentDate,
      notes,
      paymentMethod,
      referenceNumber
    });

    if (!isValidAgreementId) {
      console.error('handlePaymentSubmit - Invalid agreement ID:', agreementId);
      return false;
    }

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
        payment_method: paymentMethod || 'cash',
        reference_number: referenceNumber || '',
        status: 'completed'
      });
      console.log('usePayment.handlePaymentSubmit - Payment submitted successfully');
      return true;
    } catch (error) {
      console.error("Error submitting payment:", error);
      return false;
    }
  };

  // Enhanced generatePayment function with proper validation
  const generatePayment = async (targetAgreementId?: string) => {
    const idToUse = targetAgreementId || agreementId;
    console.log('usePayment.generatePayment called with:', idToUse);
    
    if (!idToUse || idToUse === 'undefined' || !isValidUuid(idToUse)) {
      console.error('generatePayment - Invalid agreement ID:', idToUse);
      throw new Error(`Invalid agreement ID: ${idToUse}`);
    }

    return paymentSchedule.generatePayment(idToUse);
  };

  return {
    ...paymentManagement,
    payments: paymentHistory,
    handlePaymentSubmit,
    // Expose the generatePayment function from usePaymentSchedule with validation
    generatePayment,
    runPaymentMaintenance: paymentSchedule.runMaintenanceJob,
    fixPaymentAnomalies: paymentSchedule.fixPaymentAnomalies,
    isPending: {
      ...paymentManagement.loadingStates,
      generatePayment: paymentSchedule.isPending.generatePayment,
      runMaintenance: paymentSchedule.isPending.runMaintenanceJob,
      fixAnomalies: paymentSchedule.isPending.fixPaymentAnomalies
    },
    isValidAgreementId // Expose for debugging
  };
}
