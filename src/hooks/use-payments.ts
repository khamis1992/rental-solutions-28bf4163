
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { paymentRepository, asLeaseIdColumn, asPaymentId } from '@/lib/database';

export type Payment = {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  due_date: string | null;
  status: string;
  payment_method: string | null;
  description: string | null;
  type: string;
  late_fine_amount: number;
  days_overdue: number;
  original_due_date: string | null;
  transaction_id: string | null;
  [key: string]: any; // Allow additional properties
};

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
    const safePaymentId = asPaymentId(paymentId);
    if (!safePaymentId) {
      throw new Error("Invalid payment ID");
    }

    const response = await paymentRepository.delete(safePaymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      throw response.error;
    }
    return { success: true };
  }, {
    onSuccess: () => {
      refetch();
    }
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
