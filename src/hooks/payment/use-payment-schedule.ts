
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { useLoadingStates } from './use-loading-states';
import { isValidUUID, validateUUID } from '@/lib/uuid-validation';

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
    mutationFn: async (agreementId: string | undefined | null) => {
      console.log('Generating payment for agreement ID:', agreementId);
      
      // Comprehensive validation of agreement ID
      if (!agreementId || typeof agreementId !== 'string') {
        console.error('Invalid agreement ID provided (not a string):', agreementId);
        throw new Error('Agreement ID must be a valid string');
      }

      // Check for common invalid values
      if (agreementId === 'undefined' || agreementId === 'null' || agreementId.trim() === '') {
        console.error('Invalid agreement ID provided (undefined/null/empty):', agreementId);
        throw new Error('Agreement ID cannot be undefined, null, or empty');
      }

      // Validate UUID format
      if (!isValidUUID(agreementId)) {
        console.error('Invalid UUID format for agreement ID:', agreementId);
        throw new Error(`Invalid UUID format for agreement ID: ${agreementId}`);
      }

      try {
        // Additional validation before calling the function
        const validatedId = validateUUID(agreementId, 'Agreement ID');
        console.log('Validated agreement ID:', validatedId);
        
        const result = await forceGeneratePaymentForAgreement(supabase, validatedId);
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
      console.error('Payment generation error:', error);
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
  const generatePayment = async (agreementId: string | undefined | null) => {
    console.log('generatePayment called with:', agreementId);
    
    // Early validation before any processing
    if (!agreementId || typeof agreementId !== 'string') {
      console.error('Invalid agreement ID provided to generatePayment:', agreementId);
      toast.error('Invalid agreement ID. Cannot generate payment schedule.');
      return { success: false, message: 'Invalid agreement ID' };
    }

    if (agreementId === 'undefined' || agreementId === 'null' || agreementId.trim() === '') {
      console.error('Invalid agreement ID provided to generatePayment (undefined/null/empty):', agreementId);
      toast.error('Invalid agreement ID. Cannot generate payment schedule.');
      return { success: false, message: 'Invalid agreement ID' };
    }

    if (!isValidUUID(agreementId)) {
      console.error('Invalid UUID format provided to generatePayment:', agreementId);
      toast.error('Invalid agreement ID format. Please check the agreement details.');
      return { success: false, message: 'Invalid UUID format' };
    }

    try {
      setLoading('generatePayment');
      const result = await generatePaymentMutation.mutateAsync(agreementId);
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
