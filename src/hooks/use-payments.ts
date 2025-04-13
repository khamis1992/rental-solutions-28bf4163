
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { DatabaseId, castToDatabaseId, handleDatabaseResponse, ensureArray } from '@/lib/type-helpers';
import { supabase } from '@/lib/supabase';
import { castDbId } from '@/lib/supabase-types';
import { asTableId } from '@/lib/uuid-helpers';

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
      
      // Use proper type casting for the ID
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', asTableId('unified_payments', agreementId));
        
      const responseData = handleDatabaseResponse(response);
      
      // Ensure we always return an array of Payment objects
      return ensureArray<Payment>(responseData as Payment[]);
    },
    {
      enabled: !!agreementId,
    }
  );

  // Ensure we always have an array of payments, even if data is null or undefined
  const payments: Payment[] = ensureArray(data);

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    const response = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select();

    return handleDatabaseResponse(response);
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: DatabaseId; data: Partial<Payment> }) => {
    const response = await supabase
      .from('unified_payments')
      .update(paymentUpdate.data)
      .eq('id', asTableId('unified_payments', paymentUpdate.id as string))
      .select();

    return handleDatabaseResponse(response);
  });

  const deletePayment = useSupabaseMutation(async (paymentId: DatabaseId) => {
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', asTableId('unified_payments', paymentId as string));

    return handleDatabaseResponse(response);
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
