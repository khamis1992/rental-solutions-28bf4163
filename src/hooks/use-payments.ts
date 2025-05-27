
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { paymentRepository } from '@/lib/database';
import { asLeaseId, asPaymentId } from '@/utils/type-adapters';
import { isValidUuid } from '@/types/db';
import type { Payment } from '@/types/payment.types';

export const usePayments = (agreementId?: string) => {
  console.log('usePayments called with agreementId:', agreementId);
  
  // Validate agreement ID before making any queries
  const isValidAgreementId = agreementId && 
    agreementId !== 'undefined' && 
    agreementId !== 'null' && 
    isValidUuid(agreementId);

  console.log('usePayments - isValidAgreementId:', isValidAgreementId);

  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!isValidAgreementId) {
        console.warn('usePayments - Invalid or missing agreement ID, returning empty array');
        return [] as Payment[];
      }
      
      console.log('usePayments - Fetching payments for agreement:', agreementId);
      const response = await paymentRepository.findByLeaseId(agreementId);
      
      if (response.error) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      console.log('usePayments - Fetched payments:', response.data);
      return response.data as Payment[] || [];
    },
    {
      enabled: isValidAgreementId,
    }
  );

  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    console.log('usePayments.addPayment called with:', newPayment);
    
    // Validate that we have a valid agreement ID
    if (!isValidAgreementId) {
      console.error('Cannot add payment - invalid agreement ID:', agreementId);
      throw new Error(`Invalid agreement ID: ${agreementId}`);
    }

    // Ensure status is set to completed for new payments if not specified
    const paymentToAdd = {
      ...newPayment,
      lease_id: newPayment.lease_id || agreementId,
      status: newPayment.status || 'completed'
    };
    
    console.log('usePayments.addPayment - Adding payment:', paymentToAdd);
    const response = await paymentRepository.recordPayment(paymentToAdd);

    if (response.error) {
      console.error("Error adding payment:", response.error);
      throw new Error(response.error.message || 'Failed to add payment');
    }
    
    console.log('usePayments.addPayment - Payment added successfully:', response.data);
    return response.data;
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    console.log('usePayments.updatePayment called with:', paymentUpdate);
    
    // Destructuring should happen outside the function for clarity
    const { id, data: paymentData } = paymentUpdate;
    
    // Make sure we have a valid payment ID
    if (!id || id === 'undefined' || !isValidUuid(id)) {
      console.error('Invalid payment ID for update:', id);
      throw new Error(`Invalid payment ID: ${id}`);
    }

    const response = await paymentRepository.update(id, paymentData);

    if (response.error) {
      console.error("Error updating payment:", response.error);
      throw response.error;
    }
    
    console.log('usePayments.updatePayment - Payment updated successfully:', response.data);
    return response.data;
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    console.log('usePayments.deletePayment called with:', paymentId);
    
    if (!paymentId || paymentId === 'undefined' || !isValidUuid(paymentId)) {
      console.error('Invalid payment ID for deletion:', paymentId);
      throw new Error(`Invalid payment ID: ${paymentId}`);
    }

    const response = await paymentRepository.delete(paymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      throw response.error;
    }
    
    console.log('usePayments.deletePayment - Payment deleted successfully');
    return { success: true };
  });

  const fetchPayments = () => {
    console.log('usePayments.fetchPayments called');
    if (!isValidAgreementId) {
      console.warn('Cannot fetch payments - invalid agreement ID:', agreementId);
      return Promise.resolve();
    }
    return refetch();
  };

  return {
    payments,
    isLoading,
    error,
    addPayment: addPayment.mutateAsync,
    updatePayment: updatePayment.mutateAsync,
    deletePayment: deletePayment.mutateAsync,
    fetchPayments,
    isValidAgreementId, // Expose this for debugging
  };
};
