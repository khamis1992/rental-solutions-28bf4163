
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Payment } from '@/types/payment.types';

export const usePaymentManagement = (leaseId?: string) => {
  const queryClient = useQueryClient();

  // Fetch payments for a specific lease with better error handling
  const { data: payments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['payments', leaseId],
    queryFn: async () => {
      if (!leaseId) return [];
      
      console.log('Fetching payments for lease:', leaseId);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('payment_date', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      console.log('Found payments:', data?.length || 0);
      return data || [];
    },
    enabled: !!leaseId,
    staleTime: // 30000 - removed unused variable// 30 seconds
    refetchOnWindowFocus: false
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (paymentData: Partial<Payment>) => {
      console.log('Creating payment:', paymentData);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .insert(paymentData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
      
      console.log('Payment created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['payment-sync-status', leaseId] });
      toast.success('Payment created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create payment:', error);
      toast.error(`Failed to create payment: ${error.message}`);
    }
  });

  // Add payment function (alias for createPayment)
  const addPayment = async (paymentData: Partial<Payment>) => {
    return createPayment.mutateAsync(paymentData);
  };

  // Update payment mutation
  const updatePayment = useMutation({
    mutationFn: async ({ id, data: updates }: { id: string; data: Partial<Payment> }) => {
      console.log('Updating payment:', id, updates);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
      
      console.log('Payment updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['payment-sync-status', leaseId] });
      toast.success('Payment updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update payment:', error);
      toast.error(`Failed to update payment: ${error.message}`);
    }
  });

  // Delete payment mutation
  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting payment:', id);
      
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting payment:', error);
        throw error;
      }
      
      console.log('Payment deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['payment-sync-status', leaseId] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete payment:', error);
      toast.error(`Failed to delete payment: ${error.message}`);
    }
  });

  // Update historical payment statuses
  const updateHistoricalStatuses = async () => {
    if (!leaseId) return { updatedCount: 0 };
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', leaseId)
        .eq('status', 'pending')
        .lt('original_due_date', cutoffDate.toISOString());
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { updatedCount: 0 };
      }
      
      const paymentIds = data.map(payment => payment.id);
      const { error: updateError } = await supabase
        .from('unified_payments')
        .update({ status: 'completed' })
        .in('id', paymentIds);
      
      if (updateError) throw updateError;
      
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      return { updatedCount: paymentIds.length };
    } catch (error) {
      console.error('Error updating historical payment statuses:', error);
      throw error;
    }
  };

  // Loading states
  const loadingStates = {
    createPayment: createPayment.isPending,
    updatePayment: updatePayment.isPending,
    deletePayment: deletePayment.isPending,
    updateHistoricalStatuses: false
  };

  // Special payment function that returns success/error information
  const recordSpecialPayment = async (paymentData: Partial<Payment>) => {
    try {
      const result = await createPayment.mutateAsync(paymentData);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error recording special payment:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    payments,
    isLoading,
    error,
    refetch,
    createPayment,
    addPayment,
    updatePayment,
    deletePayment,
    updateHistoricalStatuses,
    loadingStates,
    recordSpecialPayment
  };
};
