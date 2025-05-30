
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentSyncService } from '@/services/PaymentSyncService';
import { toast } from 'sonner';

/**
 * Hook for payment synchronization operations
 */
export function usePaymentSync() {
  const queryClient = useQueryClient();
  const [syncResults, setSyncResults] = useState<any>(null);

  // Sync specific agreement
  const syncAgreementMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentSyncService.syncAgreementPayments(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to sync agreement');
      }
      return result.data;
    },
    onSuccess: (data, agreementId) => {
      toast.success(`Payment sync completed for agreement`);
      setSyncResults({ agreementId, ...data });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Payment sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Fix specific agreement payment sync
  const fixAgreementSyncMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentSyncService.fixAgreementPaymentSync(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fix agreement sync');
      }
      return result.data;
    },
    onSuccess: (data, agreementId) => {
      toast.success(`Payment sync fixed for agreement`);
      setSyncResults(data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Payment sync fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Bulk fix all agreements
  const bulkFixMutation = useMutation({
    mutationFn: async () => {
      const result = await paymentSyncService.fixAllAgreementPaymentSync();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to bulk fix agreements');
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Bulk payment sync completed: ${data.successful}/${data.total} agreements fixed`);
      setSyncResults(data);
      // Invalidate all payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payment-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Bulk payment sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Helper functions
  const syncAgreement = useCallback((agreementId: string) => {
    return syncAgreementMutation.mutateAsync(agreementId);
  }, [syncAgreementMutation]);

  const fixAgreementSync = useCallback((agreementId: string) => {
    return fixAgreementSyncMutation.mutateAsync(agreementId);
  }, [fixAgreementSyncMutation]);

  const bulkFixAllAgreements = useCallback(() => {
    return bulkFixMutation.mutateAsync();
  }, [bulkFixMutation]);

  return {
    // Operations
    syncAgreement,
    fixAgreementSync,
    bulkFixAllAgreements,
    
    // State
    syncResults,
    setSyncResults,
    
    // Loading states
    isPending: {
      sync: syncAgreementMutation.isPending,
      fix: fixAgreementSyncMutation.isPending,
      bulkFix: bulkFixMutation.isPending
    },
    
    // Status
    isAnyLoading: syncAgreementMutation.isPending || 
                  fixAgreementSyncMutation.isPending || 
                  bulkFixMutation.isPending
  };
}
