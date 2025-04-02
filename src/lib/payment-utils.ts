import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        
        // Sort by status priority: completed > partially_paid > pending
        monthPayments.sort((a, b) => {
          const statusOrder = { completed: 0, paid: 0, partially_paid: 1, pending: 2 };
          return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
        });
        
        // Keep the first (highest priority) payment and mark others for deletion
        const [keepPayment, ...duplicates] = monthPayments;
        
        // Delete duplicates
        for (const duplicate of duplicates) {
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
      .select('start_date, end_date, rent_amount, id')
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
            // Calculate late fee
            const dailyLateFee = payment.daily_late_fee || leaseData.daily_late_fee || 120;
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
