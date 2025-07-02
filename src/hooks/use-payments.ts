import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types/payment.types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/service.types';

export const usePayments = (leaseId: string) => {
  const queryClient = useQueryClient();
  const [payments, setPayments] = useState<Payment[]>([]);

  const { data, isLoading, error, refetch } = useQuery<Payment[]>({
    queryKey: ['payments', leaseId],
    queryFn: async () => {
      if (!leaseId) return [];
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('payment_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching payments:', error);
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!leaseId
  });

  useEffect(() => {
    if (data) {
      setPayments(data);
    }
  }, [data]);

  const addPayment = useCallback(async (newPayment: Partial<Payment>) => {
    const { data, error } = await supabase
      .from('unified_payments')
      .insert([newPayment])
      .select()
      .single();

    if (error) {
      console.error('Error adding payment:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'message' in error ? 
                          String(error.message) : 'Failed to add payment';
      throw new Error(errorMessage);
    }

    return data;
  }, []);

  const updatePayment = useCallback(async ({ id, data: updateData }: { id: string; data: Partial<Payment> }) => {
    const { data, error } = await supabase
      .from('unified_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'message' in error ? 
                          String(error.message) : 'Failed to update payment';
      throw new Error(errorMessage);
    }

    return data;
  }, []);

  const deletePayment = useCallback(async (paymentId: string) => {
    const { error } = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  }, []);

  const addPaymentMutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      toast.success('Payment added successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'message' in error ? 
                          String((error as any).message) : 'Failed to add payment';
      toast.error(`Failed to add payment: ${errorMessage}`);
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      toast.success('Payment updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to update payment: ${errorMessage}`);
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to delete payment: ${errorMessage}`);
    }
  });

  return {
    payments,
    isLoading,
    error,
    fetchPayments: refetch,
    addPayment: addPaymentMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
    isPending: {
      add: addPaymentMutation.isPending,
      update: updatePaymentMutation.isPending,
      delete: deletePaymentMutation.isPending
    }
  };
};
