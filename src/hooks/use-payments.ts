
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { DbId, PaymentStatus, castDbId } from '@/lib/supabase-types';
import { supabase } from '@/lib/supabase';
import { handleSupabaseResponse } from '@/lib/supabase-types';

// Define a Payment type to ensure consistent typing
export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
}

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', castDbId(agreementId));
        
      const responseData = handleSupabaseResponse(response);
      
      // Ensure we always return an array of Payment objects
      if (!responseData) return [] as Payment[];
      if (!Array.isArray(responseData)) return [] as Payment[];
      
      return responseData as Payment[];
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

    return handleSupabaseResponse(response);
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: DbId; data: Partial<Payment> }) => {
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
