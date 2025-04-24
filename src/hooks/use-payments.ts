
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { asLeaseIdColumn, asPaymentId } from '@/utils/database-type-helpers';

export const usePayments = (agreementId?: string) => {
  const { data, isLoading, error, refetch } = useSupabaseQuery(
    ['payments', agreementId],
    async () => {
      if (!agreementId) return [] as Payment[];
      
      console.log("usePayments: Fetching payments for agreement", agreementId);
      
      const response = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('created_at', { ascending: false });
        
      if (!hasData(response)) {
        console.error("Error fetching payments:", response.error);
        return [] as Payment[];
      }
      
      // Transform response data to match Payment type
      const paymentsData = response.data.map((payment: any) => ({
        id: payment.id,
        lease_id: payment.lease_id,
        amount: payment.amount,
        amount_paid: payment.amount_paid,
        balance: payment.balance,
        payment_date: payment.payment_date,
        late_fine_amount: payment.late_fine_amount,
        days_overdue: payment.days_overdue,
        status: payment.status,
        type: payment.type,
        payment_method: payment.payment_method,
        description: payment.description,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }));
      
      console.log(`usePayments: Found ${paymentsData.length} payments`);
      return paymentsData as Payment[];
    },
    {
      enabled: !!agreementId,
    }
  );

  // Ensure we always have an array of payments, even if data is null or undefined
  const payments: Payment[] = Array.isArray(data) ? data : [];

  const addPayment = useSupabaseMutation(async (newPayment: Partial<Payment>) => {
    console.log("usePayments: Adding new payment", newPayment);
    const response = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select();

    if (!hasData(response)) {
      console.error("Error adding payment:", response.error);
      return null;
    }
    
    console.log("usePayments: Payment added successfully", response.data[0]);
    return response.data[0];
  }, {
    onSuccess: () => {
      console.log("usePayments: Payment added successfully, refreshing");
      refetch(); // Refresh payment list after successful addition
    }
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
    console.log("usePayments: Deleting payment", paymentId);
    const response = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId);

    if (response.error) {
      console.error("Error deleting payment:", response.error);
      return null;
    }
    
    console.log("usePayments: Payment deleted successfully");
    return { success: true };
  });

  // Add a function to fetch payments that uses refetch
  const fetchPayments = async () => {
    console.log("usePayments: Manually fetching payments");
    const result = await refetch();
    console.log("usePayments: Fetch result", result);
    return result;
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
