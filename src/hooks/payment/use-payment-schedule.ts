
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLoadingStates } from './use-loading-states';
import { supabase } from '@/lib/supabase';

// Define loading states specific to payment generation
export interface PaymentScheduleLoadingStates {
  generatePayment: boolean;
  runMaintenanceJob: boolean;
  fixPaymentAnomalies: boolean;
}

export const usePaymentSchedule = () => {
  // Use loading states for tracking async operations
  const { loadingStates, setLoading, setIdle } = useLoadingStates<PaymentScheduleLoadingStates>({
    generatePayment: false,
    runMaintenanceJob: false,
    fixPaymentAnomalies: false
  });

  // Generate a payment schedule for an agreement
  const generatePayment = useCallback(async (agreementId?: string): Promise<boolean> => {
    if (!agreementId) {
      toast.error("No agreement ID provided");
      return false;
    }

    setLoading('generatePayment');
    
    try {
      // Call the database function to generate a payment
      const { data, error } = await supabase
        .rpc('generate_payment_for_agreement', { lease_id: agreementId });
      
      if (error) {
        console.error('Error generating payment:', error);
        toast.error(`Failed to generate payment: ${error.message}`);
        return false;
      }
      
      toast.success('Payment schedule generated successfully');
      return true;
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      toast.error('Failed to generate payment schedule');
      return false;
    } finally {
      setIdle('generatePayment');
    }
  }, [setLoading, setIdle]);

  // Run payment system maintenance
  const runMaintenanceJob = useCallback(async (): Promise<boolean> => {
    setLoading('runMaintenanceJob');
    
    try {
      // Call the maintenance function
      const { data, error } = await supabase.rpc('process_payment_maintenance');
      
      if (error) {
        console.error('Error running payment maintenance:', error);
        toast.error(`Failed to run maintenance: ${error.message}`);
        return false;
      }
      
      toast.success('Payment maintenance completed successfully');
      return true;
    } catch (error) {
      console.error('Error running payment maintenance:', error);
      toast.error('Failed to run payment maintenance');
      return false;
    } finally {
      setIdle('runMaintenanceJob');
    }
  }, [setLoading, setIdle]);

  // Fix payment anomalies for a specific agreement
  const fixPaymentAnomalies = useCallback(async (agreementId?: string): Promise<boolean> => {
    if (!agreementId) {
      toast.error("No agreement ID provided");
      return false;
    }

    setLoading('fixPaymentAnomalies');
    
    try {
      // Call the function to fix payment anomalies
      const { data, error } = await supabase
        .rpc('fix_agreement_payments', { lease_id: agreementId });
      
      if (error) {
        console.error('Error fixing payment anomalies:', error);
        toast.error(`Failed to fix payment anomalies: ${error.message}`);
        return false;
      }
      
      toast.success('Payment anomalies fixed successfully');
      return true;
    } catch (error) {
      console.error('Error fixing payment anomalies:', error);
      toast.error('Failed to fix payment anomalies');
      return false;
    } finally {
      setIdle('fixPaymentAnomalies');
    }
  }, [setLoading, setIdle]);

  return {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: loadingStates
  };
};
