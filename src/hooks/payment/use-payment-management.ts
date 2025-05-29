
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Payment } from '@/types/payment.types';

export const usePaymentManagement = (leaseId?: string) => {
  const queryClient = useQueryClient();

  // Fetch payments for a specific lease
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payments', leaseId],
    queryFn: async () => {
      if (!leaseId) return [];
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!leaseId
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (paymentData: Partial<Payment>) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert(paymentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create payment: ${error.message}`);
    }
  });

  // Update payment mutation
  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Payment>) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update payment: ${error.message}`);
    }
  });

  // Delete payment mutation
  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete payment: ${error.message}`);
    }
  });

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
    createPayment,
    updatePayment,
    deletePayment,
    recordSpecialPayment
  };
};
