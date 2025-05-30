
import { useCallback } from 'react';
import { usePaymentSync } from './use-payment-sync';
import { toast } from 'sonner';

export function useAgreementPaymentSync(agreementId?: string) {
  const { syncPaymentSchedule, fixDuplicatePayments, generateMissingPayments, isPending } = usePaymentSync();

  const syncAll = useCallback(async () => {
    if (!agreementId) {
      toast.error('No agreement ID provided');
      return;
    }

    try {
      // Step 1: Fix any duplicate payments
      await fixDuplicatePayments.mutateAsync(agreementId);
      
      // Step 2: Generate any missing payment records
      await generateMissingPayments.mutateAsync(agreementId);
      
      // Step 3: Sync payment schedule with actual payments
      await syncPaymentSchedule.mutateAsync(agreementId);
      
      toast.success('Payment data synchronized successfully');
    } catch (error) {
      toast.error('Failed to complete payment synchronization');
      console.error('Payment sync error:', error);
    }
  }, [agreementId, fixDuplicatePayments, generateMissingPayments, syncPaymentSchedule]);

  return {
    syncAll,
    syncPaymentSchedule: () => agreementId && syncPaymentSchedule.mutate(agreementId),
    fixDuplicatePayments: () => agreementId && fixDuplicatePayments.mutate(agreementId),
    generateMissingPayments: () => agreementId && generateMissingPayments.mutate(agreementId),
    isPending: {
      ...isPending,
      all: isPending.sync || isPending.fix || isPending.generate
    }
  };
}
