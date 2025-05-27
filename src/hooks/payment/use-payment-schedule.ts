
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { useLoadingStates } from './use-loading-states';
import { isValidUuid } from '@/types/db';

/**
 * Hook for payment schedule management operations
 */
export function usePaymentSchedule() {
  const queryClient = useQueryClient();
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    generatePayment: false,
    runMaintenanceJob: false,
    fixPaymentAnomalies: false
  });

  // Generate a payment for a specific agreement
  const generatePaymentMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      console.log('usePaymentSchedule.generatePayment called with:', agreementId);
      
      // Validate agreement ID
      if (!agreementId || agreementId === 'undefined' || !isValidUuid(agreementId)) {
        console.error('Invalid agreement ID provided to generatePayment:', agreementId);
        throw new Error(`Invalid agreement ID: ${agreementId}. Must be a valid UUID.`);
      }

      try {
        console.log('usePaymentSchedule - Calling forceGeneratePaymentForAgreement with:', agreementId);
        const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
        console.log('usePaymentSchedule - forceGeneratePaymentForAgreement result:', result);
        return result;
      } catch (error) {
        console.error("Error generating payment:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('usePaymentSchedule.generatePayment success:', data);
      if (data.success) {
        toast.success(data.message || 'Payment schedule generated successfully');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      } else {
        toast.error(data.message || 'Failed to generate payment schedule');
      }
    },
    onError: (error) => {
      console.error('usePaymentSchedule.generatePayment error:', error);
      toast.error(`Error generating payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Run maintenance job for all agreements - this will generate missing payments
  const maintenanceJobMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('usePaymentSchedule - Running maintenance job');
        
        const { data: leasesMissingPayments, error: viewError } = await supabase
          .from('leases_missing_payments')
          .select('*');

        if (viewError) {
          console.error('Error fetching leases missing payments:', viewError);
          throw new Error(`Database error: ${viewError.message}`);
        }

        console.log('usePaymentSchedule - Found leases missing payments:', leasesMissingPayments?.length || 0);

        const { data: triggerResult, error: triggerError } = await supabase
          .rpc('generate_missing_payment_records');

        if (triggerError) {
          console.error('Error running maintenance job:', triggerError);
          throw new Error(`Maintenance job error: ${triggerError.message}`);
        }

        console.log('usePaymentSchedule - Maintenance job completed:', triggerResult);
        return { success: true, data: triggerResult };
      } catch (error) {
        console.error("Error running maintenance job:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('usePaymentSchedule.maintenanceJob success');
      toast.success('Payment maintenance job completed');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      console.error('usePaymentSchedule.maintenanceJob error:', error);
      toast.error(`Error running maintenance job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Fix payment anomalies (duplicate payments, incorrect statuses)
  const fixPaymentAnomaliesMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('usePaymentSchedule - Fixing payment anomalies');
        
        const { data, error } = await supabase.rpc('fix_payment_anomalies');
        
        if (error) {
          console.error('Error fixing payment anomalies:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log('usePaymentSchedule - Payment anomalies fixed:', data);
        return { success: true, data };
      } catch (error) {
        console.error("Error fixing payment anomalies:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('usePaymentSchedule.fixPaymentAnomalies success');
      toast.success('Payment anomalies fixed successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      console.error('usePaymentSchedule.fixPaymentAnomalies error:', error);
      toast.error(`Error fixing payment anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Wrapper functions with loading state management
  const generatePayment = async (agreementId: string) => {
    console.log('usePaymentSchedule.generatePayment wrapper called with:', agreementId);
    
    // Validate agreement ID before proceeding
    if (!agreementId || agreementId === 'undefined' || !isValidUuid(agreementId)) {
      console.error('generatePayment wrapper - Invalid agreement ID:', agreementId);
      toast.error(`Invalid agreement ID: ${agreementId}`);
      return { success: false, message: 'Invalid agreement ID' };
    }

    try {
      setLoading('generatePayment');
      const result = await generatePaymentMutation.mutateAsync(agreementId);
      console.log('usePaymentSchedule.generatePayment wrapper result:', result);
      return result;
    } finally {
      setIdle('generatePayment');
    }
  };

  const runMaintenanceJob = async () => {
    try {
      setLoading('runMaintenanceJob');
      const result = await maintenanceJobMutation.mutateAsync();
      return result;
    } finally {
      setIdle('runMaintenanceJob');
    }
  };

  const fixPaymentAnomalies = async () => {
    try {
      setLoading('fixPaymentAnomalies');
      const result = await fixPaymentAnomaliesMutation.mutateAsync();
      return result;
    } finally {
      setIdle('fixPaymentAnomalies');
    }
  };

  return {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: loadingStates
  };
}
