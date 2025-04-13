
import { useSupabaseQuery, useSupabaseMutation, createSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase';
import { asTableId } from '@/lib/uuid-helpers';
import { hasData } from '@/utils/supabase-type-helpers';

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
    const response = await supabase
      .from('unified_payments')
      .update(paymentUpdate.data)
      .eq('id', paymentUpdate.id)
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
