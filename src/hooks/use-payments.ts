
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { paymentRepository } from '@/lib/database';
import { isValidUUID } from '@/lib/uuid-validation';
import type { Payment } from '@/types/payment.types';

export const usePayments = (agreementId?: string | null | undefined) => {
  // Validate the agreementId before making any queries
  const isValidAgreementId = agreementId && isValidUUID(agreementId);
  
  console.log('usePayments called with:', { agreementId, isValidAgreementId });
  
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      // Return empty array if agreementId is invalid
      if (!isValidAgreementId) {
        console.warn('usePayments: Invalid agreement ID provided:', agreementId);
        return [] as Payment[];
      }
      
      console.log('usePayments: Making database query for agreementId:', agreementId);
      const response = await paymentRepository.findByLeaseId(agreementId);
      
      if (response.error) {
        console.error("usePayments: Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      return response.data as Payment[] || [];
    },
    {
      enabled: isValidAgreementId,
    }
  );

  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    // Ensure status is set to completed for new payments if not specified
    const paymentToAdd = {
      ...newPayment,
      status: newPayment.status || 'completed'
    };
    
    const response = await paymentRepository.recordPayment(paymentToAdd);

    if (response.error) {
      console.error("usePayments: Error adding payment:", response.error);
      return null;
    }
    return response.data;
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const { id, data: paymentData } = paymentUpdate;
    
    if (!isValidUUID(id)) {
      throw new Error(`Invalid payment ID: ${id}`);
    }

    const response = await paymentRepository.update(id, paymentData);

    if (response.error) {
      console.error("usePayments: Error updating payment:", response.error);
      throw response.error;
    }
    return response.data;
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    if (!isValidUUID(paymentId)) {
      throw new Error(`Invalid payment ID: ${paymentId}`);
    }

    const response = await paymentRepository.delete(paymentId);

    if (response.error) {
      console.error("usePayments: Error deleting payment:", response.error);
      throw response.error;
    }
    return { success: true };
  });

  const fetchPayments = () => {
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
