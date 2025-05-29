
import { useEffect, useCallback } from 'react';
import { usePaymentScheduleManagement } from './use-payment-schedule-management';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';

interface UseAgreementPaymentSyncProps {
  agreement: Agreement | null;
  autoGenerate?: boolean;
}

/**
 * Hook to ensure payment schedules are synchronized with agreements
 */
export function useAgreementPaymentSync({ 
  agreement, 
  autoGenerate = true 
}: UseAgreementPaymentSyncProps) {
  const {
    paymentSchedule,
    isLoading,
    generatePaymentSchedule,
    isPending
  } = usePaymentScheduleManagement(agreement?.id);

  // Check if agreement needs payment schedule generation
  const needsScheduleGeneration = useCallback(() => {
    if (!agreement) return false;
    
    // Only generate for active agreements
    if (agreement.status !== 'active') return false;
    
    // Check if required fields are present
    const hasRequiredFields = agreement.start_date && 
                             agreement.end_date && 
                             agreement.rent_amount;
    
    // Check if schedule doesn't exist or is empty
    const hasNoSchedule = paymentSchedule.length === 0;
    
    return hasRequiredFields && hasNoSchedule && !isLoading;
  }, [agreement, paymentSchedule, isLoading]);

  // Auto-generate payment schedule when needed
  useEffect(() => {
    if (!autoGenerate || !needsScheduleGeneration()) return;
    
    const generateScheduleAsync = async () => {
      if (!agreement) return;
      
      try {
        // Use default values if not set
        const paymentFrequency = agreement.payment_frequency || 'monthly';
        const paymentDay = agreement.payment_day || 1;
        
        console.log(`Auto-generating payment schedule for agreement ${agreement.id}`);
        
        await generatePaymentSchedule(
          new Date(agreement.start_date!),
          new Date(agreement.end_date!),
          agreement.rent_amount!,
          paymentFrequency,
          paymentDay
        );
        
        toast.success('Payment schedule generated automatically');
      } catch (error) {
        console.error('Failed to auto-generate payment schedule:', error);
        toast.error('Failed to generate payment schedule');
      }
    };
    
    // Add a small delay to ensure all data is loaded
    const timeoutId = setTimeout(generateScheduleAsync, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [agreement, needsScheduleGeneration, generatePaymentSchedule, autoGenerate]);

  return {
    paymentSchedule,
    isLoading,
    needsScheduleGeneration: needsScheduleGeneration(),
    isPending: isPending.generate,
    generatePaymentSchedule
  };
}
