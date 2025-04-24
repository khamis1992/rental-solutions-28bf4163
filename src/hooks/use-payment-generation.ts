
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generatePaymentSchedule, handleLateFees, processExistingPayment } from '@/utils/payment-generation-utils';
import { useLateFees } from './use-late-fees';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { recordLateFee } = useLateFees(agreementId);

  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleSpecialAgreementPayments = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string,
    paymentMethod: string = 'cash',
    referenceNumber?: string,
    includeLatePaymentFee: boolean = false,
    isPartialPayment: boolean = false,
    targetPaymentId?: string
  ) => {
    if (!agreement && !agreementId) {
      toast.error("Agreement information is missing");
      return false;
    }
    
    setIsProcessing(true);
    try {
      let existingPaymentId: string | null = null;
      let existingPaymentAmount: number = 0;
      let existingAmountPaid: number = 0;
      
      const queryParams = new URLSearchParams(window.location.search);
      const paymentId = targetPaymentId || queryParams.get('paymentId');
      
      if (paymentId) {
        const { data: existingPayment, error: queryError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('id', paymentId)
          .single();
          
        if (queryError) {
          console.error("Error fetching existing payment:", queryError);
        } else if (existingPayment) {
          existingPaymentId = existingPayment.id;
          existingPaymentAmount = existingPayment.amount || 0;
          existingAmountPaid = existingPayment.amount_paid || 0;
        }
      }

      // Calculate late fees if applicable
      let dailyLateFee = agreement?.daily_late_fee || 120;
      const { lateFineAmount, daysLate } = await handleLateFees(amount, paymentDate, dailyLateFee);
      
      if (existingPaymentId) {
        const result = await processExistingPayment(
          existingPaymentId,
          amount,
          existingAmountPaid,
          existingPaymentAmount,
          paymentDate,
          paymentMethod
        );
        
        if (!result.success) {
          toast.error(result.message);
          return false;
        }
        
        toast.success(result.message);
      } else {
        const paymentRecord = {
          lease_id: agreementId,
          amount: agreement?.rent_amount || 0,
          amount_paid: amount,
          balance: isPartialPayment ? Math.max(0, (agreement?.rent_amount || 0) - amount) : 0,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || `Monthly rent payment for ${agreement?.agreement_number}`,
          status: isPartialPayment ? 'partially_paid' : 'completed',
          type: 'rent',
          days_overdue: daysLate,
          late_fine_amount: lateFineAmount,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        const { error } = await supabase
          .from('unified_payments')
          .insert(paymentRecord)
          .select('id')
          .single();
        
        if (error) {
          console.error("Payment recording error:", error);
          toast.error("Failed to record payment");
          return false;
        }
        
        if (lateFineAmount > 0 && includeLatePaymentFee) {
          const lateFeeSuccess = await recordLateFee(
            lateFineAmount,
            daysLate,
            paymentDate,
            paymentMethod,
            referenceNumber
          );
          
          if (!lateFeeSuccess) {
            toast.warning("Payment recorded but failed to record late fee");
          } else {
            toast.success(isPartialPayment ? 
              "Partial payment and late fee recorded successfully" : 
              "Payment and late fee recorded successfully");
          }
        } else {
          toast.success(isPartialPayment ? 
            "Partial payment recorded successfully" : 
            "Payment recorded successfully");
        }
      }
      
      refreshAgreementData();
      return true;
    } catch (error) {
      console.error("Unexpected error recording payment:", error);
      toast.error("An unexpected error occurred while recording payment");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [agreement, agreementId, refreshAgreementData, recordLateFee]);

  return {
    refreshTrigger,
    refreshAgreementData,
    handleSpecialAgreementPayments,
    isProcessing
  };
};

