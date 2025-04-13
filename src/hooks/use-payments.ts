
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { DbId, PaymentStatus, castDbId } from '@/lib/supabase-types';
import { supabase } from '@/lib/supabase';
import { handleSupabaseResponse } from '@/lib/supabase-types';

export const usePayments = (agreementId?: string) => {
  const { data: payments, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return null;
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', castDbId(agreementId));
        
      return handleSupabaseResponse(response);
    },
    {
      enabled: !!agreementId,
    }
  );

  const addPayment = useSupabaseMutation(async (newPayment: any) => {
    const response = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select();

    return handleSupabaseResponse(response);
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: DbId; data: any }) => {
    const response = await supabase
      .from('unified_payments')
      .update(paymentUpdate.data)
      .eq('id', paymentUpdate.id)
      .select();

    return handleSupabaseResponse(response);
  });

  const deletePayment = useSupabaseMutation(async (paymentId: DbId) => {
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId);

    return handleSupabaseResponse(response);
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
