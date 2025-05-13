
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SpecialPaymentOptions } from '@/types/payment.types';

/**
 * Hook for handling special payment scenarios like late fees
 */
export const useSpecialPayment = (agreementId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Calculate late fee based on payment date
   */
  const calculateLateFee = useCallback((paymentDate: Date, agreementData: any = null) => {
    // Get the daily late fee rate (default to 120 QAR)
    const dailyLateFee = agreementData?.daily_late_fee || 120;
    
    // If payment is after the 1st of the month, calculate late fee
    let daysLate = 0;
    let lateFineAmount = 0;
    
    if (paymentDate.getDate() > 1) {
      // Calculate days late (payment date - 1st of month)
      daysLate = paymentDate.getDate() - 1;
      
      // Calculate late fee amount (capped at 3000 QAR)
      lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
    }
    
    return { amount: lateFineAmount, daysLate };
  }, []);

  /**
   * Process a payment with optional late fee
   */
  const processPayment = useCallback(async (
    amount: number, 
    paymentDate: Date,
    options: SpecialPaymentOptions = {}
  ) => {
    if (!agreementId) {
      toast.error("Agreement ID is required");
      return false;
    }
    
    const {
      notes,
      paymentMethod = 'cash',
      referenceNumber,
      includeLatePaymentFee = false,
      isPartialPayment = false,
      paymentType = 'rent',
      targetPaymentId
    } = options;
    
    setIsProcessing(true);
    
    try {
      // Check if this is an additional payment for a partially paid record
      let existingPaymentId: string | null = null;
      let existingPaymentAmount: number = 0;
      let existingAmountPaid: number = 0;
      let existingBalance: number = 0;
      
      // If we're updating an existing payment (explicitly provided or from query param)
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
      
      // Get lease data to access daily_late_fee
      let dailyLateFee = 120; // Default value
      
      // If we don't have agreement data, fetch it from supabase
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
        
        console.log("Updating existing payment:", {
          existingPaymentId,
          totalPaid,
          newBalance,
          newStatus,
          paymentDate: paymentDate.toISOString()
        });
        
        // Create payment update object
        const updateData = {
          amount_paid: totalPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null
        };
        
        // Update the existing payment record
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update(updateData)
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
          // Find the rent amount from lease data
          const rentAmount = leaseData?.rent_amount || amount;
          balance = Math.max(0, rentAmount - amount);
        }
        
        // Prepare the payment record
        try {
          const paymentData = {
            lease_id: agreementId,
            amount: leaseData?.rent_amount || amount,
            amount_paid: amountPaid,
            balance: balance,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            description: notes || `Monthly rent payment`,
            status: paymentStatus,
            type: paymentType,
            days_overdue: daysLate,
            late_fine_amount: lateFineAmount,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          };
          
          const { data, error } = await supabase
            .from('unified_payments')
            .insert([paymentData])
            .select('id')
            .single();
        
          if (error) {
            console.error("Payment recording error:", error);
            toast.error("Failed to record payment");
            return false;
          }
        
          // If there's a late fee to apply and user opted to include it, record it as a separate transaction
          if (lateFineAmount > 0 && includeLatePaymentFee) {
            const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(paymentDate);
            const year = paymentDate.getFullYear();
            
            // Create the late fee record
            const lateFeeData = {
              lease_id: agreementId,
              amount: lateFineAmount,
              amount_paid: lateFineAmount,
              balance: 0,
              payment_date: paymentDate.toISOString(),
              payment_method: paymentMethod,
              reference_number: referenceNumber || null,
              description: `Late payment fee for ${month} ${year} (${daysLate} days late)`,
              status: 'completed',
              type: 'LATE_PAYMENT_FEE',
              late_fine_amount: lateFineAmount,
              days_overdue: daysLate,
              original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
            };
            
            const { error: lateFeeError } = await supabase
              .from('unified_payments')
              .insert([lateFeeData]);
            
            if (lateFeeError) {
              console.error("Late fee recording error:", lateFeeError);
              toast.error("Payment recorded, but failed to record late fee");
            } else {
              toast.success("Payment and late fee recorded successfully!");
            }
          } else {
            toast.success("Payment recorded successfully!");
          }
          
          return true;
        } catch (error) {
          console.error("Error inserting payment record:", error);
          toast.error("Failed to record payment due to database error");
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in processPayment:", error);
      toast.error("Failed to process payment");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [agreementId]);

  return {
    isProcessing,
    calculateLateFee,
    processPayment
  };
};
