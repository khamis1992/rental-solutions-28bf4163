
/**
 * Payment Service Migration Adapter
 * 
 * This adapter provides backward compatibility with the old payment hooks
 * while leveraging the new standardized payment service.
 * 
 * It should be used as a temporary solution during migration and removed
 * once all components have been updated to use the new hooks directly.
 */
import { useMemo, useCallback } from 'react';
import { usePaymentQuery } from '@/hooks/use-payment-query';
import { Payment } from '@/types/payment.types';

export const usePaymentsAdapter = (agreementId?: string) => {
  // Use the new payment query hook
  const {
    getAgreementPayments,
    createPayment,
    updatePayment,
    deletePayment,
    processSpecialPayment,
    connectionStatus
  } = usePaymentQuery();

  // Get payments for the agreement
  const paymentsQuery = getAgreementPayments(agreementId || '');
  
  // Adapt to the old interface expected by components
  const payments = paymentsQuery.data?.data || [];
  const isLoading = paymentsQuery.isLoading;
  const error = paymentsQuery.error;
  
  // Define the refetch function to match old API
  const refetch = useCallback(() => {
    paymentsQuery.refetch();
  }, [paymentsQuery]);

  // Adapt mutation functions to match old API
  const addPaymentMutation = createPayment();
  const updatePaymentMutation = updatePayment();
  const deletePaymentMutation = deletePayment();
  
  const addPayment = useCallback(async (newPayment: Partial<Payment>) => {
    if (!agreementId) return null;
    
    // Convert to the format expected by the new service
    const paymentData = {
      ...newPayment,
      lease_id: agreementId,
      status: newPayment.status || 'completed',
    };
    
    const result = await addPaymentMutation.mutateAsync(paymentData);
    return result;
  }, [agreementId, addPaymentMutation]);
  
  const updatePaymentRecord = useCallback(async (id: string, updatedPayment: Partial<Payment>) => {
    const result = await updatePaymentMutation.mutateAsync({ 
      id, 
      data: updatedPayment 
    });
    return result;
  }, [updatePaymentMutation]);
  
  const deletePaymentRecord = useCallback(async (id: string) => {
    if (!agreementId) return null;
    
    const result = await deletePaymentMutation.mutateAsync({ 
      id, 
      agreementId 
    });
    return result;
  }, [agreementId, deletePaymentMutation]);
  
  const processPayment = useCallback(async (
    amount: number,
    paymentDate: Date,
    options?: {
      notes?: string;
      paymentMethod?: string;
      referenceNumber?: string;
      includeLatePaymentFee?: boolean;
      isPartialPayment?: boolean;
      paymentType?: string;
    }
  ) => {
    if (!agreementId) return null;
    
    const specialPaymentMutation = processSpecialPayment();
    
    const result = await specialPaymentMutation.mutateAsync({
      agreementId,
      amount,
      paymentDate,
      options
    });
    
    return result;
  }, [agreementId, processSpecialPayment]);
  
  // Return an object that matches the shape of the old hook
  return useMemo(() => ({
    payments,
    isLoading,
    error,
    refetch,
    addPayment,
    updatePayment: updatePaymentRecord,
    deletePayment: deletePaymentRecord,
    processPayment,
    fetchPayments: refetch,
    isConnected: connectionStatus !== 'disconnected'
  }), [
    payments, 
    isLoading, 
    error, 
    refetch, 
    addPayment, 
    updatePaymentRecord, 
    deletePaymentRecord, 
    processPayment,
    connectionStatus
  ]);
};

/**
 * Combined payment hook adapter that provides both legacy and new functionality
 */
export const usePaymentAdapter = (agreementId?: string) => {
  const legacyHookResult = usePaymentsAdapter(agreementId);
  const newHook = usePaymentQuery();
  
  return {
    // Legacy interface
    ...legacyHookResult,
    
    // New interface (properly typed and with more features)
    paymentQuery: newHook
  };
};
