
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to refresh agreement data
  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Handle special agreement payments with late fee calculation
  const handleSpecialAgreementPayments = useCallback(async (amount: number, paymentDate: Date, description?: string) => {
    if (!agreement || !agreementId) {
      toast.error("Agreement information is missing");
      return false;
    }
    
    setIsProcessing(true);
    try {
      // Calculate if there's a late fee applicable
      let lateFeeAmount = 0;
      let daysLate = 0;
      
      // If payment is after the 1st of the month, calculate late fee
      if (paymentDate.getDate() > 1) {
        // Calculate days late (payment date - 1st of month)
        daysLate = paymentDate.getDate() - 1;
        
        // Use agreement's daily_late_fee or default to 120 QAR
        const dailyLateFee = agreement.daily_late_fee || 120;
        
        // Calculate late fee amount (capped at 3000 QAR)
        lateFeeAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      // Form the payment record
      const paymentRecord = {
        lease_id: agreementId,
        amount: amount,
        payment_date: paymentDate.toISOString(),
        payment_method: 'cash', // Default to cash, can be made configurable
        description: description || `Monthly rent payment for ${agreement.agreement_number}`,
        status: 'completed',
        type: 'Income',
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
      
      // If there's a late fee to apply, record it as a separate transaction
      if (lateFeeAmount > 0) {
        const lateFeeRecord = {
          lease_id: agreementId,
          amount: lateFeeAmount,
          payment_date: paymentDate.toISOString(),
          payment_method: 'cash',
          description: `Late payment fee for ${format(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
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
          toast.success("Payment and late fee recorded successfully");
        }
      } else {
        toast.success("Payment recorded successfully");
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

// Helper function to format date
function format(date: Date, formatString: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return formatString.replace('MMMM', months[date.getMonth()])
                     .replace('yyyy', date.getFullYear().toString());
}
