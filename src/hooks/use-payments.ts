
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';
import { castDbId } from '@/utils/database-type-helpers';
import { mapToExtendedPayments } from '@/utils/response-mapper';
import { useErrorTracking } from './use-error-tracking';

export const usePayments = (leaseId?: string) => {
  const queryClient = useQueryClient();
  const { trackError } = useErrorTracking();
  
  const fetchPayments = useCallback(async () => {
    if (!leaseId) return [] as ExtendedPayment[];
    
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', castDbId(leaseId))
        .order('due_date', { ascending: false });
        
      if (error) {
        trackError(error, { leaseId }, 'fetchPayments');
        throw new Error('Failed to fetch payments');
      }
      
      return mapToExtendedPayments(data) || [];
    } catch (error) {
      trackError(error instanceof Error ? error : new Error('Unknown payment error'), 
        { leaseId }, 'fetchPayments');
      throw error;
    }
  }, [leaseId, trackError]);
  
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
        .eq('id', castDbId(id));
        
      if (error) {
        throw new Error(`Failed to update payment: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    },
    onError: (error) => {
      trackError(error, { leaseId }, 'updatePayment');
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
      trackError(error, { leaseId }, 'addPayment');
      toast.error(`Add payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', castDbId(id));
        
      if (error) {
        throw new Error(`Failed to delete payment: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
    },
    onError: (error) => {
      trackError(error, { leaseId }, 'deletePayment');
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  return {
    payments: payments || [],
    isLoading,
    fetchPayments: refetch,
    updatePayment: updatePaymentMutation.mutateAsync,
    addPayment: addPaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync
  };
};
