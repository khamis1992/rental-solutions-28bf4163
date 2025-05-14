
import { createClient } from '@supabase/supabase-js';
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';
import { asTableId } from '@/lib/database-helpers';
import { supabase as robustClient } from '@/integrations/supabase/client';

// Re-export the robust client implementation
export const supabase = robustClient;

/**
 * Runs payment schedule maintenance job
 * This function checks and creates missing payment schedules for active agreements
 */
export const runPaymentScheduleMaintenanceJob = async () => {
  try {
    console.log("Running payment schedule maintenance job");
    const result = await checkAndCreateMissingPaymentSchedules();
    
    if (result.success) {
      console.log(`Payment schedule maintenance job completed: ${result.message}`);
    } else {
      console.error(`Payment schedule maintenance job failed: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error("Unexpected error in runPaymentScheduleMaintenanceJob:", error);
    throw error;
  }
};

/**
 * Manually run payment maintenance job for testing purposes
 */
export const manuallyRunPaymentMaintenance = async () => {
  return await runPaymentScheduleMaintenanceJob();
};

/**
 * Checks and generates monthly payments for active agreements
 * This function ensures all active agreements have payment schedules for each month
 * @returns Object with success status and message
 */
export const checkAndGenerateMonthlyPayments = async () => {
  try {
    console.log("Running monthly payment check");
    
    // Call Supabase RPC function to generate missing payment records
    const { data, error } = await supabase.rpc('generate_missing_payment_records');
    
    if (error) {
      console.error("Error generating payment records:", error);
      return {
        success: false,
        message: `Failed to generate payment records: ${error.message}`
      };
    }
    
    console.log("Monthly payment check completed successfully");
    return {
      success: true,
      message: "Monthly payment check completed successfully",
      records: data
    };
  } catch (error) {
    console.error("Error in checkAndGenerateMonthlyPayments:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Fixes duplicate or problematic payment records for a specific agreement
 * This function identifies and resolves payment inconsistencies
 * @param agreementId The ID of the agreement to fix payments for
 */
export const fixAgreementPayments = async (agreementId: string) => {
  try {
    console.log(`Fixing payment records for agreement ${agreementId}`);
    
    // First, get all payments for this agreement
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asTableId('unified_payments', agreementId))
      .order('original_due_date', { ascending: true });
    
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return { 
        success: false, 
        message: `Failed to fetch payments: ${paymentsError.message}` 
      };
    }
    
    if (!payments || payments.length === 0) {
      return { 
        success: true, 
        message: "No payments found for this agreement" 
      };
    }
    
    // Group payments by month to detect duplicates
    const paymentsByMonth: Record<string, any[]> = {};
    
    payments.forEach(payment => {
      if (!payment.original_due_date) return;
      
      const date = new Date(payment.original_due_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = [];
      }
      
      paymentsByMonth[monthKey].push(payment);
    });
    
    // Check for and fix duplicates
    let fixedCount = 0;
    
    for (const [month, monthlyPayments] of Object.entries(paymentsByMonth)) {
      // If there's more than one payment per month, we have duplicates
      if (monthlyPayments.length > 1) {
        console.log(`Found ${monthlyPayments.length} payments for month ${month}`);
        
        // Sort payments by creation date, keeping the oldest
        monthlyPayments.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Keep the first (oldest) payment and delete the rest
        const [keepPayment, ...duplicatePayments] = monthlyPayments;
        
        for (const duplicate of duplicatePayments) {
          const { error: deleteError } = await supabase
            .from('unified_payments')
            .delete()
            .eq('id', duplicate.id);
            
          if (deleteError) {
            console.error(`Error deleting duplicate payment ${duplicate.id}:`, deleteError);
          } else {
            console.log(`Successfully deleted duplicate payment ${duplicate.id}`);
            fixedCount++;
          }
        }
      }
    }
    
    return { 
      success: true, 
      fixedCount,
      message: `Fixed ${fixedCount} duplicate payment records` 
    };
    
  } catch (error) {
    console.error("Error in fixAgreementPayments:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
