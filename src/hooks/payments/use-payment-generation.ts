
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useSpecialPaymentHandler } from './use-special-payment-handler';

/**
 * Hook for handling payment generation and refreshing of agreement data
 */
export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { handleSpecialAgreementPayments } = useSpecialPaymentHandler(
    agreement, 
    agreementId, 
    setIsProcessing
  );

  // Function to refresh agreement data
  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    refreshTrigger,
    refreshAgreementData,
    handleSpecialAgreementPayments,
    isProcessing
  };
};
