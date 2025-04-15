
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase';
import { hasData, asLeaseId } from '@/utils/database-type-helpers';
import { Payment } from '@/components/agreements/PaymentHistory.types';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId);
        
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

  // Ensure we always have an array of payments, even if data is null or undefined
  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    const response = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select();

    if (!hasData(response)) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    return response.data[0];
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const { id, data: paymentData } = paymentUpdate;
    
    const response = await supabase
      .from('unified_payments')
      .update(paymentData)
      .eq('id', id)
      .select();

    if (!hasData(response)) {
      console.error("Error updating payment:", response.error);
      return null;
    }
    return response.data[0];
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      return null;
    }
    return { success: true };
  });

  // Add a function to fetch payments that uses refetch
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
