import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SimpleAgreement } from '@/hooks/use-agreements';

/**
 * Finds and fixes duplicate payment entries for a given lease
 * @param leaseId The ID of the lease/agreement to check
 * @returns Object with success status and optional counts
 */
export const fixDuplicatePayments = async (leaseId: string): Promise<{
  success: boolean;
  message: string;
  fixedCount?: number;
  error?: any;
}> => {
  try {
    console.log(`Checking for duplicate payments for lease: ${leaseId}`);
    
    // Get all payments for this lease
    const { data: payments, error } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', leaseId)
      .order('original_due_date', { ascending: true });
    
    if (error) {
      console.error("Error fetching payments:", error);
      return {
        success: false,
        message: `Failed to fetch payments: ${error.message}`,
        error
      };
    }
    
    if (!payments || payments.length === 0) {
      return {
        success: true,
        message: "No payments found for this agreement",
        fixedCount: 0
      };
    }
    
    // Group payments by month (yyyy-mm)
    const paymentsByMonth: Record<string, any[]> = {};
    payments.forEach(payment => {
      if (!payment.original_due_date) return;
      
      const date = new Date(payment.original_due_date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!paymentsByMonth[yearMonth]) {
        paymentsByMonth[yearMonth] = [];
      }
      
      paymentsByMonth[yearMonth].push(payment);
    });
    
    // Check for duplicates and fix issues
    let fixedCount = 0;
    
    for (const [yearMonth, monthPayments] of Object.entries(paymentsByMonth)) {
      if (monthPayments.length > 1) {
        console.log(`Found ${monthPayments.length} payments for ${yearMonth}`);
        
        // Enhanced sorting with more comprehensive status priority
        // paid/completed > partially_paid > overdue > pending
        monthPayments.sort((a, b) => {
          const statusOrder = { 
            completed: 0, 
            paid: 0, 
            partially_paid: 1, 
            overdue: 2,
            pending: 3 
          };
          
          // Get status priorities (defaulting to lowest priority if status not recognized)
          const statusA = statusOrder[a.status] ?? 4;
          const statusB = statusOrder[b.status] ?? 4;
          
          // If same status priority but one has amount_paid and the other doesn't,
          // prioritize the one with payment
          if (statusA === statusB) {
            if (a.amount_paid && !b.amount_paid) return -1;
            if (!a.amount_paid && b.amount_paid) return 1;
            
            // If both have amount_paid, prioritize the one with higher amount_paid
            if (a.amount_paid && b.amount_paid) {
              return b.amount_paid - a.amount_paid;
            }
            
            // If both are overdue, keep the one with more days_overdue
            if (a.status === 'overdue' && b.status === 'overdue') {
              return (b.days_overdue || 0) - (a.days_overdue || 0);
            }
            
            // If same priority and no other differentiators, keep the most recently updated
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
          }
          
          return statusA - statusB;
        });
        
        // Keep the first (highest priority) payment and mark others for deletion
        const [keepPayment, ...duplicates] = monthPayments;
        
        console.log(`Keeping payment ${keepPayment.id} with status ${keepPayment.status} for ${yearMonth}`);
        
        // Delete duplicates
        for (const duplicate of duplicates) {
          console.log(`Deleting duplicate payment ${duplicate.id} with status ${duplicate.status} for ${yearMonth}`);
          
          // If we're deleting a payment with some amount_paid but keeping one without payment
          // (shouldn't happen with our sorting, but just to be safe)
          if (duplicate.amount_paid && !keepPayment.amount_paid) {
            console.log(`Warning: Deleting payment with amount_paid: ${duplicate.amount_paid}`);
            
            // Update the kept payment with the amount_paid info
            const { error: updateError } = await supabase
              .from('unified_payments')
              .update({
                amount_paid: duplicate.amount_paid,
                payment_date: duplicate.payment_date,
                status: duplicate.status,
                payment_method: duplicate.payment_method || keepPayment.payment_method,
                transaction_id: duplicate.transaction_id || keepPayment.transaction_id
              })
              .eq('id', keepPayment.id);
              
            if (updateError) {
              console.error(`Error updating payment info: ${updateError.message}`);
            } else {
              console.log(`Transferred payment info to kept payment ${keepPayment.id}`);
            }
          }
          
          const { error: deleteError } = await supabase
            .from('unified_payments')
            .delete()
            .eq('id', duplicate.id);
          
          if (deleteError) {
            console.error(`Error deleting duplicate payment ${duplicate.id}:`, deleteError);
          } else {
            fixedCount++;
            console.log(`Deleted duplicate payment ${duplicate.id} for ${yearMonth}`);
          }
        }
      }
    }
    
    // Check for missing months between start and end dates
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .select('start_date, end_date, rent_amount, id, daily_late_fee, rent_due_day')
      .eq('id', leaseId)
      .single();
    
    if (leaseError) {
      console.error(`Error fetching lease details:`, leaseError);
      return {
        success: true,
        message: `Fixed ${fixedCount} duplicate payments but couldn't check for missing months`,
        fixedCount
      };
    }
    
    if (leaseData && leaseData.start_date && leaseData.end_date) {
      const startDate = new Date(leaseData.start_date);
      const endDate = new Date(leaseData.end_date);
      const currentDate = new Date();
      
      // Limit end date to current date (don't generate future payments yet)
      const effectiveEndDate = endDate > currentDate ? currentDate : endDate;
      
      // Create a set of existing payment months
      const existingMonths = new Set(Object.keys(paymentsByMonth));
      
      // Loop through months from start to end date
      for (let month = new Date(startDate); month <= effectiveEndDate; month.setMonth(month.getMonth() + 1)) {
        const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        
        // If we don't have a payment for this month and it's not a future month, create one
        if (!existingMonths.has(yearMonth)) {
          console.log(`Creating missing payment for ${yearMonth}`);
          
          // Create payment record
          const dueDate = new Date(month.getFullYear(), month.getMonth(), 1);
          const paymentStatus = dueDate < currentDate ? 'overdue' : 'pending';
          const daysOverdue = dueDate < currentDate ? 
            Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          
          const { error: insertError } = await supabase
            .from('unified_payments')
            .insert({
              lease_id: leaseId,
              amount: leaseData.rent_amount,
              description: `Monthly Rent - ${month.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
              type: 'rent',
              status: paymentStatus,
              payment_date: null,
              original_due_date: dueDate.toISOString(),
              days_overdue: daysOverdue
            });
            
          if (insertError) {
            console.error(`Error creating payment for ${yearMonth}:`, insertError);
          } else {
            fixedCount++;
            console.log(`Created missing payment for ${yearMonth}`);
          }
        }
      }
    }
    
    return {
      success: true,
      message: `Fixed ${fixedCount} payment issues`,
      fixedCount
    };
  } catch (err) {
    console.error("Unexpected error in fixDuplicatePayments:", err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      error: err
    };
  }
};

/**
 * Ensures all required monthly payments exist and fixes status of overdue payments
 * @param leaseId The ID of the lease/agreement to check
 * @returns Object with success status and results
 */
export const ensureAllMonthlyPayments = async (leaseId: string): Promise<{
  success: boolean;
  message: string;
  generatedCount?: number;
  updatedCount?: number;
  error?: any;
}> => {
  try {
    // First fix duplicates
    const fixResult = await fixDuplicatePayments(leaseId);
    if (!fixResult.success) {
      return fixResult;
    }
    
    // Then ensure we have the correct payment records
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .select('start_date, end_date, rent_amount, id, daily_late_fee, rent_due_day')
      .eq('id', leaseId)
      .single();
    
    if (leaseError) {
      console.error(`Error fetching lease details:`, leaseError);
      return {
        success: false,
        message: `Failed to fetch lease details: ${leaseError.message}`,
        error: leaseError
      };
    }
    
    if (!leaseData || !leaseData.start_date || !leaseData.end_date) {
      return {
        success: false,
        message: "Lease data is incomplete",
      };
    }
    
    const startDate = new Date(leaseData.start_date);
    const endDate = new Date(leaseData.end_date);
    const currentDate = new Date();
    
    // Get all existing payments
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', leaseId);
    
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return {
        success: false,
        message: `Failed to fetch payments: ${paymentsError.message}`,
        error: paymentsError
      };
    }
    
    // Create map of year-month to payment
    const paymentMap = new Map();
    payments?.forEach(payment => {
      if (payment.original_due_date) {
        const date = new Date(payment.original_due_date);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        paymentMap.set(yearMonth, payment);
      }
    });
    
    let generatedCount = 0;
    let updatedCount = 0;
    
    // Loop through each month of the lease up to current date
    const lastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    
    for (
      let month = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      month <= lastMonth && month <= endDate;
      month.setMonth(month.getMonth() + 1)
    ) {
      const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      // Check if we have a payment for this month
      if (!paymentMap.has(yearMonth)) {
        // No payment exists, create one
        const dueDay = leaseData.rent_due_day || 1;
        const dueDate = new Date(month.getFullYear(), month.getMonth(), dueDay);
        const paymentStatus = dueDate < currentDate ? 'overdue' : 'pending';
        const daysOverdue = dueDate < currentDate ? 
          Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        // Calculate late fee if applicable
        const dailyLateFee = leaseData.daily_late_fee || 120;
        const lateFeeAmount = daysOverdue > 0 ? Math.min(daysOverdue * dailyLateFee, 3000) : 0;
        
        const { error: insertError } = await supabase
          .from('unified_payments')
          .insert({
            lease_id: leaseId,
            amount: leaseData.rent_amount,
            description: `Monthly Rent - ${month.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            type: 'rent',
            status: paymentStatus,
            payment_date: null,
            original_due_date: dueDate.toISOString(),
            days_overdue: daysOverdue,
            late_fine_amount: lateFeeAmount
          });
          
        if (insertError) {
          console.error(`Error creating payment for ${yearMonth}:`, insertError);
        } else {
          generatedCount++;
          console.log(`Created payment for ${yearMonth}`);
        }
      } else {
        // Payment exists, check if we need to update the status
        const payment = paymentMap.get(yearMonth);
        if (payment.status === 'pending' && new Date(payment.original_due_date) < currentDate) {
          // Calculate days overdue
          const dueDate = new Date(payment.original_due_date);
          const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // If days overdue changed or status needs update
          if (daysOverdue > (payment.days_overdue || 0) || payment.status !== 'overdue') {
            // Calculate late fee - use lease data for daily late fee
            const dailyLateFee = leaseData.daily_late_fee || 120;
            const lateFeeAmount = Math.min(daysOverdue * dailyLateFee, 3000);
            
            const { error: updateError } = await supabase
              .from('unified_payments')
              .update({
                status: 'overdue',
                days_overdue: daysOverdue,
                late_fine_amount: lateFeeAmount
              })
              .eq('id', payment.id);
              
            if (updateError) {
              console.error(`Error updating payment ${payment.id}:`, updateError);
            } else {
              updatedCount++;
              console.log(`Updated payment ${payment.id} to overdue (${daysOverdue} days)`);
            }
          }
        }
      }
    }
    
    return {
      success: true,
      message: `Generated ${generatedCount} new payments and updated ${updatedCount} existing payments`,
      generatedCount,
      updatedCount
    };
  } catch (err) {
    console.error("Unexpected error in ensureAllMonthlyPayments:", err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      error: err
    };
  }
};

/**
 * Records a payment and reconciles it against outstanding balances
 * @param agreement The agreement/lease details
 * @param amount The payment amount to process
 * @param paymentDate The date of payment
 * @param paymentMethod The payment method used
 * @param description Optional description for the payment
 * @returns Updated list of payments after reconciliation
 */
export const reconcilePayments = async (
  agreement: SimpleAgreement,
  amount?: number,
  paymentDate?: Date,
  paymentMethod: string = 'cash',
  description: string = ''
): Promise<any[]> => {
  try {
    // If no amount provided, just update payment statuses
    if (!amount || amount <= 0) {
      // Call the ensureAllMonthlyPayments function to update payment statuses
      const result = await ensureAllMonthlyPayments(agreement.id);
      
      // Get updated payment list
      const { data: updatedPayments, error: fetchError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id)
        .order('payment_date', { ascending: false });
        
      if (fetchError) {
        console.error('Error fetching updated payments:', fetchError);
        throw new Error(`Failed to fetch updated payments: ${fetchError.message}`);
      }
      
      return updatedPayments || [];
    }
    
    // With amount - process actual payment
    // First fix any duplicate/missing payments
    await fixDuplicatePayments(agreement.id);
    
    // Get payments that need to be paid, ordered by date (oldest first)
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .in('status', ['pending', 'partially_paid', 'overdue'])
      .order('original_due_date', { ascending: true });
    
    if (pendingError) {
      console.error('Error fetching pending payments:', pendingError);
      throw new Error(`Failed to fetch pending payments: ${pendingError.message}`);
    }
    
    if (!pendingPayments || pendingPayments.length === 0) {
      // If no pending payments, create a new payment record
      const paymentRecord = {
        lease_id: agreement.id,
        amount: amount,
        amount_paid: amount,
        payment_date: paymentDate ? paymentDate.toISOString() : new Date().toISOString(),
        payment_method: paymentMethod,
        status: 'paid',
        type: 'additional_payment',
        description: description || `Additional payment`,
        transaction_id: `TXN-${Date.now()}`
      };
      
      const { error: insertError } = await supabase
        .from('unified_payments')
        .insert(paymentRecord);
        
      if (insertError) {
        console.error('Error recording payment:', insertError);
        throw new Error(`Failed to record payment: ${insertError.message}`);
      }
    } else {
      // We have pending payments to reconcile
      let remainingAmount = amount;
      
      // Apply payment to each pending invoice until the amount is used up
      for (const payment of pendingPayments) {
        if (remainingAmount <= 0) break;
        
        // Calculate how much to apply to this payment
        const pendingAmount = payment.amount - (payment.amount_paid || 0);
        const amountToApply = Math.min(remainingAmount, pendingAmount);
        
        // Update the payment record
        const updatedPayment = {
          amount_paid: (payment.amount_paid || 0) + amountToApply,
          payment_date: paymentDate ? paymentDate.toISOString() : new Date().toISOString(),
          payment_method: paymentMethod,
          status: (payment.amount_paid || 0) + amountToApply >= payment.amount ? 'paid' : 'partially_paid',
          description: payment.description,
          transaction_id: payment.transaction_id || `TXN-${Date.now()}`
        };
        
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update(updatedPayment)
          .eq('id', payment.id);
          
        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
          throw new Error(`Failed to update payment: ${updateError.message}`);
        }
        
        // Reduce remaining amount
        remainingAmount -= amountToApply;
      }
      
      // If we still have remaining amount, create a new payment record
      if (remainingAmount > 0) {
        const overpaymentRecord = {
          lease_id: agreement.id,
          amount: remainingAmount,
          amount_paid: remainingAmount,
          payment_date: paymentDate ? paymentDate.toISOString() : new Date().toISOString(),
          payment_method: paymentMethod,
          status: 'paid',
          type: 'overpayment',
          description: description || `Overpayment`,
          transaction_id: `TXN-${Date.now()}`
        };
        
        const { error: insertError } = await supabase
          .from('unified_payments')
          .insert(overpaymentRecord);
          
        if (insertError) {
          console.error('Error recording overpayment:', insertError);
          throw new Error(`Failed to record overpayment: ${insertError.message}`);
        }
      }
    }
    
    // Get the updated payment list
    const { data: updatedPayments, error: fetchError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .order('payment_date', { ascending: false });
      
    if (fetchError) {
      console.error('Error fetching updated payments:', fetchError);
      throw new Error(`Failed to fetch updated payments: ${fetchError.message}`);
    }
    
    return updatedPayments || [];
  } catch (error) {
    console.error('Error in reconcilePayments:', error);
    throw error;
  }
};
