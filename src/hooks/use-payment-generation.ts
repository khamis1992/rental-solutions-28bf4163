import { useState, useCallback } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format as dateFormat } from 'date-fns';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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
      let existingBalance: number = 0;
      
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
      
      let dailyLateFee = 120;
      if (!agreement) {
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('daily_late_fee')
          .eq('id', agreementId)
          .single();
          
        if (leaseError) {
          console.error("Error fetching lease data for late fee:", leaseError);
        } else if (leaseData) {
          dailyLateFee = leaseData.daily_late_fee || 120;
        }
      } else {
        dailyLateFee = agreement.daily_late_fee || 120;
      }
      
      let lateFeeAmount = 0;
      let daysLate = 0;
      
      if (paymentDate.getDate() > 1) {
        daysLate = paymentDate.getDate() - 1;
        lateFeeAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      if (existingPaymentId) {
        const totalPaid = existingAmountPaid + amount;
        const newBalance = existingPaymentAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
        
        console.log("Updating existing payment:", {
          existingPaymentId,
          totalPaid,
          newBalance,
          newStatus,
          paymentDate: paymentDate.toISOString()
        });
        
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
        let paymentStatus = 'completed';
        let amountPaid = amount;
        let balance = 0;
        
        if (isPartialPayment) {
          paymentStatus = 'partially_paid';
          const rentAmount = agreement?.rent_amount || 0;
          balance = Math.max(0, rentAmount - amount);
        }
        
        const paymentRecord = {
          lease_id: agreementId,
          amount: agreement?.rent_amount || 0,
          amount_paid: amountPaid,
          balance: balance,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || `Monthly rent payment for ${agreement?.agreement_number || agreement?.agreementNumber}`,
          status: paymentStatus,
          type: 'rent',
          days_overdue: daysLate,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        console.log("Recording payment:", paymentRecord);
        
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
