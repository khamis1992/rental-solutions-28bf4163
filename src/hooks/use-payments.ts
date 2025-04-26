
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { asLeaseId, asPaymentId } from '@/utils/type-casting';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', asLeaseId(agreementId));
        
      if (!hasData(response)) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      return response.data as Payment[];
    },
    {
      enabled: !!agreementId,
    }
  );

  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    // Make sure we have a valid lease_id if it exists
    const paymentData = {
      ...newPayment,
      lease_id: newPayment.lease_id ? asLeaseId(newPayment.lease_id) : newPayment.lease_id
    };
    
    const response = await supabase
      .from('unified_payments')
      .insert([paymentData])
      .select();

    if (!hasData(response)) {
      console.error("Error adding payment:", response.error);
      throw new Error(response.error.message);
    }
    return response.data[0];
  }, {
    onSuccess: () => {
      refetch();
    }
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const response = await supabase
      .from('unified_payments')
      .update(paymentUpdate.data)
      .eq('id', asPaymentId(paymentUpdate.id))
      .select();

    if (!hasData(response)) {
      console.error("Error updating payment:", response.error);
      throw new Error(response.error.message);
    }
    return response.data[0];
  }, {
    onSuccess: () => {
      refetch();
    }
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', asPaymentId(paymentId));

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      throw new Error(response.error.message);
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
