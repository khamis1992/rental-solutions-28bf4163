
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { PaymentStatus } from '@/types/payment.types';
import { useLoadingStates } from '../use-loading-states';

/**
 * Hook for payment schedule management operations
 */
export function usePaymentSchedule() {
  const queryClient = useQueryClient();
  const { loadingStates, wrapWithLoading } = useLoadingStates({
    generatePayment: false,
    runMaintenanceJob: false,
    fixPaymentAnomalies: false
  });

  // Generate a payment for a specific agreement
  const generatePaymentMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      try {
        const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
        return result;
      } catch (error) {
        console.error("Error generating payment:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Payment schedule generated successfully');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      } else {
        toast.error(data.message || 'Failed to generate payment schedule');
      }
    },
    onError: (error) => {
      toast.error(`Error generating payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Run maintenance job for all agreements - this will generate missing payments
  const maintenanceJobMutation = useMutation({
    mutationFn: async () => {
      try {
        const { data: leasesMissingPayments, error: viewError } = await supabase
          .from('leases_missing_payments')
          .select('*');

        if (viewError) {
          throw new Error(`Database error: ${viewError.message}`);
        }

        const { data: triggerResult, error: triggerError } = await supabase
          .rpc('generate_missing_payment_records');

        if (triggerError) {
          throw new Error(`Maintenance job error: ${triggerError.message}`);
        }

        return { success: true, data: triggerResult };
      } catch (error) {
        console.error("Error running maintenance job:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Payment maintenance job completed');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(`Error running maintenance job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Fix payment anomalies (duplicate payments, incorrect statuses)
  const fixPaymentAnomaliesMutation = useMutation({
    mutationFn: async () => {
      try {
        const { data, error } = await supabase.rpc('fix_payment_anomalies');
        
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return { success: true, data };
      } catch (error) {
        console.error("Error fixing payment anomalies:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Payment anomalies fixed successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(`Error fixing payment anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Wrapper functions with loading state management
  const generatePayment = wrapWithLoading('generatePayment', 
    async (agreementId: string) => {
      const result = await generatePaymentMutation.mutateAsync(agreementId);
      return result;
    }
  );

  const runMaintenanceJob = wrapWithLoading('runMaintenanceJob',
    async () => {
      const result = await maintenanceJobMutation.mutateAsync();
      return result;
    }
  );

  const fixPaymentAnomalies = wrapWithLoading('fixPaymentAnomalies',
    async () => {
      const result = await fixPaymentAnomaliesMutation.mutateAsync();
      return result;
    }
  );

  return {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: loadingStates
  };
}
