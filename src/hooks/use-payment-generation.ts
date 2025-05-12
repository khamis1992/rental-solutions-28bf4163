
import { useState, useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format as dateFormat } from 'date-fns';
import { asLeaseId, asPaymentId, createPaymentInsert, createPaymentUpdate, isQueryDataValid } from '@/utils/type-adapters';

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
          .eq('id', asPaymentId(paymentId))
          .single();
          
        if (queryError) {
          console.error("Error fetching existing payment:", queryError);
        } else if (existingPayment && isQueryDataValid<{
          id: string;
          amount: number;
          amount_paid: number;
          balance: number;
        }>(existingPayment)) {
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
          .eq('id', asLeaseId(agreementId || ''))
          .single();
          
        if (leaseError) {
          console.error("Error fetching lease data for late fee:", leaseError);
        } else if (leaseData && isQueryDataValid<{ daily_late_fee: number }>(leaseData)) {
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
        
        console.log("Updating existing payment:", {
          existingPaymentId,
          totalPaid,
          newBalance,
          newStatus,
          paymentDate: paymentDate.toISOString()
        });
        
        // Create type-safe payment update
        const updateData = createPaymentUpdate({
          amount_paid: totalPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null
        });
        
        // Update the existing payment record
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update(updateData)
          .eq('id', asPaymentId(existingPaymentId));
          
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
        
        // Cast the ID to string to avoid type issues
        const safeAgreementId = agreementId || '';
        
        // Prepare the payment record with type safety
        try {
          const paymentData = createPaymentInsert({
            lease_id: asLeaseId(safeAgreementId),
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
            late_fine_amount: lateFineAmount,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          });
          
          const { data, error } = await supabase
            .from('unified_payments')
            .insert(paymentData)
            .select('id')
            .single();
        
          if (error) {
            console.error("Payment recording error:", error);
            toast.error("Failed to record payment");
            return false;
          }
        
          // If there's a late fee to apply and user opted to include it, record it as a separate transaction
          if (lateFineAmount > 0 && includeLatePaymentFee) {
            // Create the late fee record with proper typing
            const lateFeeData = createPaymentInsert({
              lease_id: asLeaseId(safeAgreementId),
              amount: lateFineAmount,
              amount_paid: lateFineAmount,
              balance: 0,
              payment_date: paymentDate.toISOString(),
              payment_method: paymentMethod,
              reference_number: referenceNumber || null,
              description: `Late payment fee for ${dateFormat(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
              status: 'completed',
              type: 'LATE_PAYMENT_FEE',
              late_fine_amount: lateFineAmount,
              days_overdue: daysLate,
              original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
            });
            
            const { error: lateFeeError } = await supabase
              .from('unified_payments')
              .insert(lateFeeData);
            
            if (lateFeeError) {
              console.error("Late fee recording error:", lateFeeError);
              toast.error("Payment recorded, but failed to record late fee");
            } else {
              toast.success("Payment and late fee recorded successfully!");
            }
          } else {
            toast.success("Payment recorded successfully!");
          }
        } catch (error) {
          console.error("Error inserting payment record:", error);
          toast.error("Failed to record payment due to database error");
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in handleSpecialAgreementPayments:", error);
      toast.error("Failed to process payment");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [agreement, agreementId]);

  return {
    isProcessing,
    refreshAgreementData,
    handleSpecialAgreementPayments
  };
};
