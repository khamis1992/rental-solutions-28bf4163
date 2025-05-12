
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService } from '@/services/PaymentService';

/**
 * Hook for managing payment schedule operations
 */
export function usePaymentSchedule() {
  const queryClient = useQueryClient();

  // Mutation for generating a payment for a specific agreement
  const generatePayment = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentService.generatePaymentForAgreement(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to generate payment');
      }
      return result.data;
    },
    onSuccess: (_, agreementId) => {
      toast.success('Payment schedule generated successfully');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to generate payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for running system-wide payment maintenance
  const runMaintenanceJob = useMutation({
    mutationFn: async () => {
      const result = await paymentService.runPaymentMaintenanceJob();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to run payment maintenance');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment maintenance completed successfully');
      // Invalidate all payment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(`Payment maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for checking and creating missing payments
  const checkMissingPayments = useMutation({
    mutationFn: async (agreementId?: string) => {
      const result = await paymentService.checkAndCreateMissingPayments(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to check for missing payments');
      }
      return result.data;
    },
    onSuccess: (_, agreementId) => {
      toast.success('Payment schedules checked and updated');
      if (agreementId) {
        queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to check payment schedules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Fix payment anomalies (duplicates, etc.) for an agreement
  const fixPaymentAnomalies = useMutation({
    mutationFn: async (agreementId: string) => {
      const result = await paymentService.fixAgreementPayments(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fix agreement payments');
      }
      return result.data;
    },
    onSuccess: (data, agreementId) => {
      toast.success(`Payment records fixed successfully: ${data.fixedCount} issues resolved`);
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to fix payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    generatePayment: generatePayment.mutateAsync,
    runMaintenanceJob: runMaintenanceJob.mutateAsync,
    checkMissingPayments: checkMissingPayments.mutateAsync,
    fixPaymentAnomalies: fixPaymentAnomalies.mutateAsync,
    isPending: {
      generatePayment: generatePayment.isPending,
      runMaintenanceJob: runMaintenanceJob.isPending,
      checkMissingPayments: checkMissingPayments.isPending,
      fixPaymentAnomalies: fixPaymentAnomalies.isPending
    }
  };
}
