
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { paymentRepository } from '@/lib/database';
import { asLeaseId, asPaymentId } from '@/utils/type-adapters';
import type { Payment } from '@/types/payment.types';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await paymentRepository.findByLeaseId(agreementId);
      
      if (response.error) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      return response.data as Payment[] || [];
    },
    {
      enabled: !!agreementId,
    }
  );

  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    // Ensure status is set to completed for new payments if not specified
    // Convert dates to strings for database compatibility
    const paymentToAdd = {
      ...newPayment,
      status: newPayment.status || 'completed',
      due_date: newPayment.due_date instanceof Date 
        ? newPayment.due_date.toISOString() 
        : newPayment.due_date,
      payment_date: newPayment.payment_date instanceof Date 
        ? newPayment.payment_date.toISOString() 
        : newPayment.payment_date,
    };
    
    const response = await paymentRepository.recordPayment(paymentToAdd);

    if (response.error) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    return response.data;
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    // Destructuring should happen outside the function for clarity
    const { id, data: paymentData } = paymentUpdate;
    
    // Make sure we have a valid payment ID
    if (!id) {
      throw new Error("Invalid payment ID");
    }

    // Convert dates to strings for database compatibility
    const dataToUpdate = {
      ...paymentData,
      due_date: paymentData.due_date instanceof Date 
        ? paymentData.due_date.toISOString() 
        : paymentData.due_date,
      payment_date: paymentData.payment_date instanceof Date 
        ? paymentData.payment_date.toISOString() 
        : paymentData.payment_date,
    };

    const response = await paymentRepository.update(id, dataToUpdate);

    if (response.error) {
      console.error("Error updating payment:", response.error);
      throw response.error;
    }
    return response.data;
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    if (!paymentId) {
      throw new Error("Invalid payment ID");
    }

    const response = await paymentRepository.delete(paymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
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
  };
};
