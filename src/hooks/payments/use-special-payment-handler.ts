import { useCallback } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format as dateFormat } from 'date-fns';
import { withTimeoutAndRetry } from '@/utils/promise';

/**
 * Hook for handling special agreement payments with advanced features
 */
export const useSpecialPaymentHandler = (
  agreement: Agreement | null, 
  agreementId: string | undefined,
  setIsProcessing: (state: boolean) => void
) => {

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
      
      // Get lease data to access daily_late_fee
      const { agreementData, dailyLateFee } = await fetchAgreementData(agreement, agreementId);
      
      // Calculate if there's a late fee applicable
      const { lateFineAmount, daysLate } = calculateLateFee(paymentDate, dailyLateFee);
      
      if (existingPaymentId) {
        // Handle updating an existing payment record
        await updateExistingPayment(
          existingPaymentId,
          existingPaymentAmount,
          existingAmountPaid,
          amount,
          paymentDate,
          paymentMethod
        );
      } else {
        // Handle creating a new payment
        await createNewPayment(
          agreementId!,
          agreement,
          agreementData,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes,
          isPartialPayment,
          lateFineAmount,
          daysLate,
          includeLatePaymentFee,
          dateFormat
        );
      }
      
      return true;
    } catch (error) {
      console.error("Unexpected error recording payment:", error);
      toast.error("An unexpected error occurred while recording payment");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [agreement, agreementId, setIsProcessing]);

  return { handleSpecialAgreementPayments };
};

// Helper functions to keep the main hook clean and focused

/**
 * Fetch agreement data if not provided
 */
async function fetchAgreementData(agreement: Agreement | null, agreementId: string | undefined) {
  // Default value
  let dailyLateFee = 120; 
  let agreementData: any = null;
  
  if (!agreement && agreementId) {
    // If agreement isn't passed in props, fetch it from supabase
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .select('daily_late_fee, rent_amount, agreement_number')
      .eq('id', agreementId)
      .single();
      
    if (leaseError) {
      console.error("Error fetching lease data for late fee:", leaseError);
    } else if (leaseData) {
      dailyLateFee = leaseData.daily_late_fee || 120;
      agreementData = leaseData;
    }
  } else if (agreement) {
    // Use the daily_late_fee from the provided agreement
    dailyLateFee = agreement.daily_late_fee || 120;
    agreementData = agreement;
  }
  
  return { agreementData, dailyLateFee };
}

/**
 * Calculate late fee if applicable
 */
function calculateLateFee(paymentDate: Date, dailyLateFee: number) {
  let lateFineAmount = 0;
  let daysLate = 0;
  
  // If payment is after the 1st of the month, calculate late fee
  if (paymentDate.getDate() > 1) {
    // Calculate days late (payment date - 1st of month)
    daysLate = paymentDate.getDate() - 1;
    
    // Calculate late fee amount (capped at 3000 QAR)
    lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
  }
  
  return { lateFineAmount, daysLate };
}

/**
 * Update an existing payment record
 */
async function updateExistingPayment(
  existingPaymentId: string,
  existingPaymentAmount: number,
  existingAmountPaid: number,
  amount: number,
  paymentDate: Date,
  paymentMethod: string
) {
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
    console.error("Error updating payment:", updateError);
    toast.error("Failed to record additional payment");
    return false;
  }
  
  toast.success(newStatus === 'completed' ? 
    "Payment completed successfully!" : 
    "Additional payment recorded successfully");
    
  return true;
}

/**
 * Create a new payment record
 */
async function createNewPayment(
  agreementId: string,
  agreement: Agreement | null,
  agreementData: any,
  amount: number,
  paymentDate: Date,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string,
  isPartialPayment: boolean = false,
  lateFineAmount: number = 0,
  daysLate: number = 0,
  includeLatePaymentFee: boolean = false,
  dateFormat: any = (date: Date, format: string) => format
) {
  // Handle partial payment if selected
  let paymentStatus = 'completed';
  let amountPaid = amount;
  let balance = 0;
  
  if (isPartialPayment) {
    paymentStatus = 'partially_paid';
    // Safe access to rent_amount with a fallback
    const rentAmount = agreement?.rent_amount || agreementData?.rent_amount || 0;
    balance = Math.max(0, rentAmount - amount);
  }
  
  // Form the payment record
  const paymentRecord = {
    lease_id: agreementId,
    // Safe access to rent_amount with a fallback
    amount: agreement?.rent_amount || agreementData?.rent_amount || 0,
    amount_paid: amountPaid,
    balance: balance,
    payment_date: paymentDate.toISOString(),
    payment_method: paymentMethod,
    reference_number: referenceNumber || null,
    description: notes || `Monthly rent payment for ${agreement?.agreement_number || agreementData?.agreement_number}`,
    status: paymentStatus,
    type: 'rent',
    days_overdue: daysLate,
    late_fine_amount: lateFineAmount,
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
  if (lateFineAmount > 0 && includeLatePaymentFee) {
    await recordLateFeePayment(
      agreementId,
      lateFineAmount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      daysLate,
      dateFormat,
      isPartialPayment
    );
  } else {
    toast.success(isPartialPayment ? 
      "Partial payment recorded successfully" : 
      "Payment recorded successfully");
  }
  
  return true;
}

/**
 * Record a separate late fee payment
 */
async function recordLateFeePayment(
  agreementId: string,
  lateFineAmount: number,
  paymentDate: Date,
  paymentMethod: string,
  referenceNumber?: string,
  daysLate: number = 0,
  dateFormat: any = (date: Date, format: string) => format,
  isPartialPayment: boolean = false
) {
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
    late_fine_amount: lateFineAmount,
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
}
