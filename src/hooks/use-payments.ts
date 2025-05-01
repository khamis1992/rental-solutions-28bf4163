
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { paymentRepository, asLeaseIdColumn, asPaymentId } from '@/lib/database';

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
    const response = await paymentRepository.recordPayment(newPayment);

    if (response.error) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    return response.data;
  }, {
    onSuccess: () => {
      refetch();
    }
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const response = await paymentRepository.update(paymentUpdate.id, paymentUpdate.data);

    if (response.error) {
      console.error("Error updating payment:", response.error);
      throw response.error;
    }
    return response.data;
  }, {
    onSuccess: () => {
      refetch();
    }
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    const response = await paymentRepository.delete(paymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      return null;
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
