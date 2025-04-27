
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';
import { asLeaseId } from '@/utils/database-type-helpers';

export const usePayments = (leaseId?: string) => {
  const queryClient = useQueryClient();
  
  const fetchPayments = useCallback(async () => {
    if (!leaseId) return [];
    
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching payments:', error);
        throw new Error('Failed to fetch payments');
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in fetchPayments:', error);
      throw error;
    }
  }, [leaseId]);
  
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', leaseId],
    queryFn: fetchPayments,
    enabled: !!leaseId,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtendedPayment> }) => {
      const { error } = await supabase
        .from('unified_payments')
        .update(data)
        .eq('id', id);
        
      if (error) {
        throw new Error(`Failed to update payment: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  const addPaymentMutation = useMutation({
    mutationFn: async (payment: Partial<ExtendedPayment>) => {
      const { error } = await supabase
        .from('unified_payments')
        .insert(payment);
        
      if (error) {
        throw new Error(`Failed to add payment: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    },
    onError: (error) => {
      toast.error(`Add payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(`Failed to delete payment: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  return {
    payments,
    isLoading,
    fetchPayments: refetch,
    updatePayment: updatePaymentMutation.mutateAsync,
    addPayment: addPaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync
  };
};
