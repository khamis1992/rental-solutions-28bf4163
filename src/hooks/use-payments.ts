
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { asLeaseId } from '@/utils/database-type-helpers';

export interface Payment {
  id: string;
  lease_id?: string;
  amount: number;
  amount_paid?: number;
  payment_date?: Date | string;
  due_date?: Date | string;
  status?: string;
  payment_method?: string;
  transaction_id?: string;
  description?: string;
  type?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export const usePayments = (leaseId?: string) => {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['payments', leaseId],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', asLeaseId(leaseId))
          .order('payment_date', { ascending: false });
        
        if (fetchError) {
          console.error('Error fetching payments:', fetchError);
          throw fetchError;
        }
        
        return data || [];
      } catch (err) {
        console.error('Error in payments query:', err);
        throw err;
      }
    },
    enabled: !!leaseId
  });

  const fetchPayments = async () => {
    return await refetch();
  };

  const addPayment = useMutation({
    mutationFn: async (payment: any) => {
      try {
        const { data, error: insertError } = await supabase
          .from('unified_payments')
          .insert([payment])
          .select();
        
        if (insertError) {
          console.error('Error adding payment:', insertError);
          throw insertError;
        }
        
        return data;
      } catch (err) {
        console.error('Error in add payment mutation:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    }
  });

  const updatePayment = useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: string; data: any }) => {
      try {
        const { data: updatedData, error: updateError } = await supabase
          .from('unified_payments')
          .update(data)
          .eq('id', paymentId)
          .select();
        
        if (updateError) {
          console.error('Error updating payment:', updateError);
          throw updateError;
        }
        
        return updatedData;
      } catch (err) {
        console.error('Error in update payment mutation:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    }
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', paymentId);
        
        if (deleteError) {
          console.error('Error deleting payment:', deleteError);
          throw deleteError;
        }
      } catch (err) {
        console.error('Error in delete payment mutation:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    }
  });

  return {
    payments,
    isLoading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    fetchPayments
  };
};
