
import { supabase } from '@/lib/supabase';
import { SimpleAgreement } from '@/hooks/use-agreements';

/**
 * Reconcile payments for an agreement
 * @param agreement The agreement to reconcile payments for
 * @param amount Optional amount for a new payment
 * @param paymentDate Optional payment date
 * @param paymentMethod Optional payment method
 * @param description Optional description
 * @returns Updated payments array
 */
export const reconcilePayments = async (
  agreement: SimpleAgreement,
  amount?: number,
  paymentDate?: Date,
  paymentMethod?: string,
  description?: string
) => {
  try {
    // Create a new payment if amount is provided
    if (amount && paymentDate) {
      const { data, error } = await supabase.from('unified_payments').insert([
        {
          lease_id: agreement.id,
          amount: amount,
          amount_paid: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod || 'cash',
          status: 'paid',
          type: 'Income',
          description: description || `Payment on ${paymentDate.toISOString().split('T')[0]}`,
          transaction_id: `TXN-${Date.now()}`
        }
      ]).select('*');

      if (error) {
        throw error;
      }
    }

    // Fetch and return all payments for this agreement
    const { data: updatedPayments, error: fetchError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .order('payment_date', { ascending: false });
      
    if (fetchError) {
      throw fetchError;
    }
    
    return updatedPayments;
  } catch (error) {
    console.error('Error reconciling payments:', error);
    throw error;
  }
};

/**
 * Ensures all monthly payments for an agreement are generated and up to date
 * @param agreementId ID of the agreement to check/fix payments for
 * @returns Result object with success status and optional counts
 */
export const ensureAllMonthlyPayments = async (agreementId: string): Promise<{
  success: boolean;
  message?: string;
  error?: any;
  generatedCount?: number;
  updatedCount?: number;
}> => {
  try {
    console.log(`Checking and fixing payments for agreement: ${agreementId}`);
    
    // First, fetch the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*')
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      return {
        success: false,
        message: `Failed to fetch agreement: ${agreementError.message}`,
        error: agreementError
      };
    }
    
    if (!agreement) {
      return {
        success: false,
        message: 'Agreement not found'
      };
    }
    
    // Check start date and ensure we have payments for each month
    const startDate = new Date(agreement.start_date);
    const today = new Date();
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const dueDay = agreement.rent_due_day || 1;
    const rentAmount = agreement.rent_amount || 0;
    
    let generatedCount = 0;
    let updatedCount = 0;
    
    // Loop through months from start date to current
    while (currentMonth <= endMonth) {
      const monthStartStr = currentMonth.toISOString().split('T')[0];
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      const monthEndStr = new Date(nextMonth.getTime() - 1).toISOString().split('T')[0];
      
      // Check if payment exists for this month
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .gte('due_date', monthStartStr)
        .lt('due_date', nextMonth.toISOString())
        .order('due_date', { ascending: false });
        
      if (paymentsError) {
        console.error(`Error checking payments for ${monthStartStr}:`, paymentsError);
        currentMonth = nextMonth;
        continue;
      }
      
      // If no payment exists for this month, create one
      if (!existingPayments || existingPayments.length === 0) {
        const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dueDay);
        
        // If due date is in the past for this month, set status to overdue
        const paymentStatus = dueDate < today ? 'overdue' : 'pending';
        const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        const { data: newPayment, error: createError } = await supabase
          .from('unified_payments')
          .insert({
            lease_id: agreementId,
            amount: rentAmount,
            description: `Monthly Rent - ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            type: 'Income',
            status: paymentStatus,
            payment_date: null,
            due_date: dueDate.toISOString(),
            days_overdue: daysOverdue,
            original_due_date: dueDate.toISOString(),
            daily_late_fee: agreement.daily_late_fee || 120
          })
          .select();
          
        if (createError) {
          console.error(`Error creating payment for ${monthStartStr}:`, createError);
        } else {
          generatedCount++;
          console.log(`Generated payment for ${monthStartStr}`);
        }
      } else if (existingPayments.length > 0) {
        // Check if payment needs late fee updates
        for (const payment of existingPayments) {
          if ((payment.status === 'pending' || payment.status === 'partially_paid') && payment.original_due_date) {
            const dueDate = new Date(payment.original_due_date);
            if (today > dueDate) {
              const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
              
              const diffTime = todayNoTime.getTime() - dueDateNoTime.getTime();
              const currentDaysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (currentDaysOverdue > (payment.days_overdue || 0)) {
                const dailyLateFee = payment.daily_late_fee || agreement.daily_late_fee || 120;
                const lateFineAmount = Math.min(currentDaysOverdue * dailyLateFee, 3000);
                
                // Update the payment record
                const { error: updateError } = await supabase
                  .from('unified_payments')
                  .update({
                    days_overdue: currentDaysOverdue,
                    late_fine_amount: lateFineAmount
                  })
                  .eq('id', payment.id);
                
                if (!updateError) {
                  updatedCount++;
                }
              }
            }
          }
        }
      }
      
      // Move to next month
      currentMonth = nextMonth;
    }
    
    return {
      success: true,
      message: `Generated ${generatedCount} payments and updated ${updatedCount} payments for agreement ${agreementId}`,
      generatedCount,
      updatedCount
    };
  } catch (error) {
    console.error("Unexpected error in ensureAllMonthlyPayments:", error);
    return {
      success: false,
      message: `Failed to ensure all monthly payments: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};
