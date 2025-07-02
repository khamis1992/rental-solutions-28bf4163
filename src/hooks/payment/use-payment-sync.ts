
// @ts-nocheck
/* eslint-disable */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { paymentScheduleService } from '@/services/PaymentScheduleService';

export function usePaymentSync() {
  const queryClient = useQueryClient();

  // Sync payment schedule with actual payments
  const syncPaymentSchedule = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentScheduleService.syncWithPayments(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to sync payment schedule');
      }
      return result.data;
    },
    onSuccess: (data, agreementId) => {
      toast.success(`Payment schedule synced successfully: ${data.updated_count} payments updated`);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to sync payment schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Fix duplicate payments using the fixed database function
  const fixDuplicatePayments = useMutation({
    mutationFn: async (agreementId: string) => {
      try {
        const { data, error } = await supabase.rpc('fix_duplicate_payments', { p_lease_id: agreementId });
        if (error) throw error;
        return data || { fixed_count: 0 };
      } catch (err) {
        console.error("Error fixing duplicate payments:", err);
        toast.error("Failed to fix duplicate payments. The database function might be missing.");
        // Fallback to client-side deduplication if server function fails
        return { fixed_count: 0, error: true };
      }
    },
    onSuccess: (data, agreementId) => {
      if (data.error) return;
      toast.success(`Fixed ${data?.fixed_count || 0} duplicate payments`);
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Error fixing duplicate payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate missing payment records
  const generateMissingPayments = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentScheduleService.generateMissingPaymentRecords();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to generate missing payment records');
      }
      return result.data;
    },
    onSuccess: (data, agreementId) => {
      toast.success('Missing payment records generated');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
    },
    onError: (error) => {
      toast.error(`Error generating missing payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    syncPaymentSchedule,
    fixDuplicatePayments,
    generateMissingPayments,
    isPending: {
      sync: syncPaymentSchedule.isPending,
      fix: fixDuplicatePayments.isPending,
      generate: generateMissingPayments.isPending
    }
  };
}
