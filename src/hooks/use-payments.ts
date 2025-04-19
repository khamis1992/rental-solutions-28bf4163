
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/database-type-helpers';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { asLeaseIdColumn, asPaymentId, UUID } from '@/utils/database-type-helpers';
import { useCallback } from 'react';

export const usePayments = (agreementId?: string) => {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      console.log(`Fetching payments for agreement: ${agreementId}`);
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', asLeaseIdColumn(agreementId));
        
      if (!hasData(response)) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      console.log(`Found ${response.data.length} payments for agreement ${agreementId}`);
      return response.data as Payment[];
    },
    {
      enabled: !!agreementId,
      staleTime: 15000, // Set a shorter stale time to refresh data more frequently
    }
  );

  // Ensure we always have an array of payments, even if data is null or undefined
  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    console.log("Adding new payment:", newPayment);
    
    const response = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select();

    if (!hasData(response)) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    
    // Refetch payments after adding a new one
    await refetch();
    return response.data[0];
  });

  const updatePayment = useSupabaseMutation(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    const { id, data: paymentData } = paymentUpdate;
    
    console.log(`Updating payment ${id} with:`, paymentData);
    
    const response = await supabase
      .from('unified_payments')
      .update(paymentData)
      .eq('id', asPaymentId(id))
      .select();

    if (!hasData(response)) {
      console.error("Error updating payment:", response.error);
      return null;
    }
    
    // Refetch payments after updating
    await refetch();
    return response.data[0];
  });

  const deletePayment = useSupabaseMutation(async (paymentId: string) => {
    console.log(`Deleting payment: ${paymentId}`);
    
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', asPaymentId(paymentId));

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      return null;
    }
    
    // Refetch payments after deletion
    await refetch();
    return { success: true };
  });

  // Add a function to fetch payments that uses refetch
  const fetchPayments = useCallback(() => {
    console.log("Manually fetching payments");
    return refetch();
  }, [refetch]);

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
