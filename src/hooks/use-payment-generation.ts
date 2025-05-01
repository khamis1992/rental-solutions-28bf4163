
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format as dateFormat } from 'date-fns';
import { logOperation } from '@/utils/monitoring-utils';

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
          logOperation(
            'paymentGeneration.handleSpecialAgreementPayments', 
            'error', 
            { paymentId, error: queryError.message },
            'Error fetching existing payment'
          );
        } else if (existingPayment) {
          existingPaymentId = existingPayment.id;
          existingPaymentAmount = existingPayment.amount || 0;
          existingAmountPaid = existingPayment.amount_paid || 0;
          existingBalance = existingPayment.balance || 0;
        }
      }
      
      // Get lease data to access daily_late_fee
      let dailyLateFee = 120; // Default value
      if (!agreement) {
        // If agreement isn't passed in props, fetch it from supabase
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('daily_late_fee')
          .eq('id', agreementId)
          .single();
          
        if (leaseError) {
          logOperation(
            'paymentGeneration.handleSpecialAgreementPayments', 
            'error', 
            { agreementId, error: leaseError.message },
            'Error fetching lease data for late fee'
          );
        } else if (leaseData) {
          dailyLateFee = leaseData.daily_late_fee || 120;
        }
      } else {
        // Use the daily_late_fee from the provided agreement
        dailyLateFee = agreement.daily_late_fee || 120;
      }
      
      // Calculate if there's a late fee applicable
      let lateFineAmount = 0;
      let daysLate = 0;
      
      // If payment is after the 1st of the month, calculate late fee
      if (paymentDate.getDate() > 1) {
        // Calculate days late (payment date - 1st of month)
        daysLate = paymentDate.getDate() - 1;
        
        // Calculate late fee amount (capped at 3000 QAR)
        lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      if (existingPaymentId) {
        // This is an additional payment for a partially paid record
        const totalPaid = existingAmountPaid + amount;
        const newBalance = existingPaymentAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
        
        logOperation(
          'paymentGeneration.handleSpecialAgreementPayments', 
          'success', 
          {
            existingPaymentId,
            totalPaid,
            newBalance,
            newStatus,
            paymentDate: paymentDate.toISOString()
          },
          'Updating existing payment'
        );
        
        // Update the existing payment record
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
          logOperation(
            'paymentGeneration.handleSpecialAgreementPayments', 
            'error', 
            { existingPaymentId, error: updateError.message },
            'Error updating payment'
          );
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
          late_fine_amount: lateFineAmount, // Using late_fine_amount instead of daily_late_fee
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        logOperation(
          'paymentGeneration.handleSpecialAgreementPayments', 
          'success', 
          { paymentRecord },
          'Recording payment'
        );
        
        // Insert the payment record
        const { data, error } = await supabase
          .from('unified_payments')
          .insert(paymentRecord)
          .select('id')
          .single();
        
        if (error) {
          logOperation(
            'paymentGeneration.handleSpecialAgreementPayments', 
            'error', 
            { error: error.message },
            'Payment recording error'
          );
          toast.error("Failed to record payment");
          return false;
        }
        
        // If there's a late fee to apply and user opted to include it, record it as a separate transaction
        if (lateFineAmount > 0 && includeLatePaymentFee) {
          const lateFeeRecord = {
            lease_id: agreementId,
            amount: lateFineAmount,
            amount_paid: lateFineAmount,
            balance: 0,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            description: `Late payment fee for ${dateFormat(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
            status: 'completed',
            type: 'LATE_PAYMENT_FEE',
            late_fine_amount: lateFineAmount, // Using late_fine_amount directly
            days_overdue: daysLate,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          };
          
          logOperation(
          'paymentGeneration.handleSpecialAgreementPayments', 
          'success', 
          { lateFeeRecord },
          'Recording late fee'
        );
          
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert(lateFeeRecord);
          
          if (lateFeeError) {
            logOperation(
              'paymentGeneration.handleSpecialAgreementPayments', 
              'error', 
              { agreementId, error: lateFeeError.message },
              'Late fee recording error'
            );
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
      logOperation(
        'paymentGeneration.handleSpecialAgreementPayments', 
        'error', 
        { error: error instanceof Error ? error.message : String(error) },
        'Unexpected error recording payment'
      );
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
