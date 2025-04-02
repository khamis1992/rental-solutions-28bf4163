
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format as dateFormat } from 'date-fns';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to refresh agreement data
  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Handle special agreement payments with late fee calculation
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
      // Check if this is an additional payment for a partially paid record
      let existingPaymentId: string | null = null;
      let existingPaymentAmount: number = 0;
      let existingAmountPaid: number = 0;
      let existingBalance: number = 0;
      
      // If we're updating an existing payment (either explicitly provided or from query param)
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
          existingBalance = existingPayment.balance || 0;
        }
      }
      
      // Calculate if there's a late fee applicable
      let lateFeeAmount = 0;
      let daysLate = 0;
      
      // If payment is after the 1st of the month, calculate late fee
      if (paymentDate.getDate() > 1) {
        // Calculate days late (payment date - 1st of month)
        daysLate = paymentDate.getDate() - 1;
        
        // Use agreement's daily_late_fee or default to 120 QAR
        // First check if the property exists in the agreement object
        const dailyLateFee = agreement && 'daily_late_fee' in agreement && typeof agreement.daily_late_fee === 'number' 
          ? agreement.daily_late_fee 
          : 120;
        
        // Calculate late fee amount (capped at 3000 QAR)
        lateFeeAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      if (existingPaymentId) {
        // This is an additional payment for a partially paid record
        const totalPaid = existingAmountPaid + amount;
        const newBalance = existingPaymentAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
        
        // Update the existing payment record - removing notes field as it doesn't exist
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            amount_paid: totalPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod
          })
          .eq('id', existingPaymentId);
          
        if (updateError) {
          console.error("Error updating payment:", updateError);
          toast.error("Failed to record additional payment");
          return false;
        }
        
        toast.success(newStatus === 'completed' ? 
          "Payment completed successfully!" : 
          "Additional payment recorded successfully");
      } else {
        // This is a new payment
        // Handle partial payment if selected
        let paymentStatus = 'completed';
        let amountPaid = amount;
        let balance = 0;
        
        if (isPartialPayment) {
          paymentStatus = 'partially_paid';
          // Safe access to rent_amount with a fallback
          const rentAmount = agreement?.rent_amount || 0;
          balance = Math.max(0, rentAmount - amount);
        }
        
        // Form the payment record
        const paymentRecord = {
          lease_id: agreementId,
          // Safe access to rent_amount with a fallback
          amount: agreement?.rent_amount || 0,
          amount_paid: amountPaid,
          balance: balance,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || `Monthly rent payment for ${agreement?.agreement_number}`,
          status: paymentStatus,
          type: 'rent',
          days_overdue: daysLate,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        console.log("Recording payment:", paymentRecord);
        
        // Insert the payment record
        const { data, error } = await supabase
          .from('unified_payments')
          .insert(paymentRecord)
          .select('id')
          .single();
        
        if (error) {
          console.error("Payment recording error:", error);
          toast.error("Failed to record payment");
          return false;
        }
        
        // If there's a late fee to apply and user opted to include it, record it as a separate transaction
        if (lateFeeAmount > 0 && includeLatePaymentFee) {
          const lateFeeRecord = {
            lease_id: agreementId,
            amount: lateFeeAmount,
            amount_paid: lateFeeAmount,
            balance: 0,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            description: `Late payment fee for ${dateFormat(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
            status: 'completed',
            type: 'LATE_PAYMENT_FEE',
            late_fine_amount: lateFeeAmount,
            days_overdue: daysLate,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          };
          
          console.log("Recording late fee:", lateFeeRecord);
          
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert(lateFeeRecord);
          
          if (lateFeeError) {
            console.error("Late fee recording error:", lateFeeError);
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
  }, [agreement, agreementId, refreshAgreementData]);

  return {
    refreshTrigger,
    refreshAgreementData,
    handleSpecialAgreementPayments,
    isProcessing
  };
};
