
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { Payment } from '@/types/agreement-types';
import { castDbId, castToUUID, hasData } from '@/utils/supabase-response-helpers';
import { supabase } from '@/integrations/supabase/client';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', castDbId(agreementId));
      
      if (response.error) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      // Use proper type casting to resolve TypeScript errors
      return (response.data || []) as unknown as Payment[];
    },
    {
      enabled: !!agreementId,
    }
  );

  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    const paymentData = { ...newPayment };
    const response = await supabase
      .from('unified_payments')
      .insert(paymentData as any)
      .select();

    if (response.error) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    
    // Properly handle response types
    if (!hasData(response)) {
      return null;
    }
    
    return response.data[0] as unknown as Payment;
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const response = await supabase
      .from('unified_payments')
      .update(paymentUpdate.data as any)
      .eq('id', castToUUID(paymentUpdate.id))
      .select();

    if (response.error) {
      console.error("Error updating payment:", response.error);
      throw response.error;
    }
    
    // Properly handle response types
    if (!hasData(response)) {
      return null;
    }
    
    return response.data[0] as unknown as Payment;
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', castToUUID(paymentId));

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

// Re-export the Payment type
export type { Payment } from '@/types/agreement-types';
