
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLoadingStates } from './use-loading-states';
import { SpecialPaymentOptions } from '@/types/payment.types';

/**
 * Hook for handling special payment scenarios
 */
export function useSpecialPayment(agreementId?: string) {
  const { loadingStates, setLoading, setIdle, isAnyLoading } = useLoadingStates({
    processing: false,
    calculating: false,
    initializing: false
  });
  
  /**
   * Calculate late payment fee for a specific payment date
   */
  const calculateLateFee = useCallback((paymentDate: Date, agreementData?: any) => {
    try {
      setLoading('calculating');
      
      // Default late fee settings
      const dailyLateFee = agreementData?.daily_late_fee || 120;
      const maxLateFee = 3000;
      
      // Calculate days late (if payment is made after the 1st of the month)
      let daysLate = 0;
      if (paymentDate.getDate() > 1) {
        daysLate = paymentDate.getDate() - 1;
      }
      
      // Calculate late fee amount (capped at maxLateFee)
      const amount = Math.min(daysLate * dailyLateFee, maxLateFee);
      
      return { amount, daysLate };
    } finally {
      setIdle('calculating');
    }
  }, [setLoading, setIdle]);

  /**
   * Process a payment with optional late fee
   */
  const processPayment = useCallback(async (
    amount: number,
    paymentDate: Date,
    options?: SpecialPaymentOptions
  ) => {
    if (!agreementId) return false;
    
    try {
      setLoading('processing');
      
      const {
        notes,
        paymentMethod = 'cash',
        referenceNumber,
        includeLatePaymentFee = false,
        isPartialPayment = false,
        paymentType = 'rent',
        targetPaymentId // This is now properly declared in SpecialPaymentOptions
      } = options || {};
      
      // Get lease data for rent amount
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('daily_late_fee, rent_amount')
        .eq('id', agreementId)
        .single();
        
      if (leaseError) {
        console.error("Error fetching lease data:", leaseError);
        toast.error("Could not fetch lease information");
        return false;
      }
      
      const rentAmount = leaseData?.rent_amount || amount;
      
      // Calculate late fee if applicable
      let lateFeeAmount = 0;
      let daysLate = 0;
      
      if (includeLatePaymentFee && paymentDate.getDate() > 1) {
        daysLate = paymentDate.getDate() - 1;
        lateFeeAmount = Math.min(daysLate * (leaseData?.daily_late_fee || 120), 3000);
      }
      
      // Create payment record
      const paymentData = {
        lease_id: agreementId,
        amount: rentAmount,
        amount_paid: amount,
        balance: isPartialPayment ? Math.max(0, rentAmount - amount) : 0,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber || '',
        description: notes || `Monthly rent payment`,
        status: isPartialPayment ? 'partially_paid' : 'completed',
        type: paymentType,
        days_overdue: daysLate,
        late_fine_amount: lateFeeAmount,
        original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
      };
      
      // Either update existing payment or create a new one
      if (targetPaymentId) {
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update(paymentData)
          .eq('id', targetPaymentId);
        
        if (updateError) {
          console.error("Error updating payment:", updateError);
          toast.error("Failed to update payment");
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from('unified_payments')
          .insert([paymentData]);
        
        if (insertError) {
          console.error("Error recording payment:", insertError);
          toast.error("Failed to record payment");
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("An unexpected error occurred");
      return false;
    } finally {
      setIdle('processing');
    }
  }, [agreementId, setLoading, setIdle]);
  
  return {
    processPayment,
    calculateLateFee,
    isProcessing: loadingStates.processing,
    isCalculating: loadingStates.calculating,
    isAnyLoading
  };
}
