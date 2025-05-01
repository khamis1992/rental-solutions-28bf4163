
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { paymentRepository, asLeaseIdColumn, asPaymentId } from '@/lib/database';
import { logOperation } from '@/utils/monitoring-utils';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await paymentRepository.findByLeaseId(agreementId);
      
      if (response.error) {
        logOperation(
          'payments.fetchPayments', 
          'error', 
          { agreementId, error: response.error.message },
          'Error fetching payments'
        );
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
      logOperation(
        'payments.addPayment', 
        'error', 
        { payment: newPayment, error: response.error.message },
        'Error adding payment'
      );
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
      logOperation(
        'payments.updatePayment', 
        'error', 
        { id: paymentUpdate.id, data: paymentUpdate.data, error: response.error.message },
        'Error updating payment'
      );
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
      logOperation(
        'payments.deletePayment', 
        'error', 
        { paymentId, error: response.error.message },
        'Error deleting payment'
      );
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
