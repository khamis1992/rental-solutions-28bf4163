
import { createClient } from '@supabase/supabase-js';
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';
import { asTableId } from '@/lib/database-helpers';
import { logOperation } from '@/utils/monitoring-utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Runs payment schedule maintenance job
 * This function checks and creates missing payment schedules for active agreements
 */
export const runPaymentScheduleMaintenanceJob = async () => {
  try {
    logOperation('paymentSchedule.maintenanceJob', 'success', 
      {}, 'Running payment schedule maintenance job');
    const result = await checkAndCreateMissingPaymentSchedules();
    
    if (result.success) {
      logOperation('paymentSchedule.maintenanceJob', 'success', 
        { message: result.message }, 'Payment schedule maintenance job completed');
    } else {
      logOperation('paymentSchedule.maintenanceJob', 'error', 
        { message: result.message }, 'Payment schedule maintenance job failed');
    }
    
    return result;
  } catch (error) {
    logOperation('paymentSchedule.maintenanceJob', 'error', 
      { error: error instanceof Error ? error.message : String(error) }, 
      'Unexpected error in payment schedule maintenance job');
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
    logOperation('paymentSchedule.generateMonthlyPayments', 'success', 
      {}, 'Running monthly payment check');
    
    // Call Supabase RPC function to generate missing payment records
    const { data, error } = await supabase.rpc('generate_missing_payment_records');
    
    if (error) {
      logOperation('paymentSchedule.generateMonthlyPayments', 'error', 
        { error: error.message }, 'Error generating payment records');
      return {
        success: false,
        message: `Failed to generate payment records: ${error.message}`
      };
    }
    
    logOperation('paymentSchedule.generateMonthlyPayments', 'success', 
      { recordCount: data?.length || 0 }, 'Monthly payment check completed successfully');
    return {
      success: true,
      message: "Monthly payment check completed successfully",
      records: data
    };
  } catch (error) {
    logOperation('paymentSchedule.generateMonthlyPayments', 'error', 
      { error: error instanceof Error ? error.message : String(error) }, 
      'Error in monthly payment generation');
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
    logOperation('paymentSchedule.fixAgreementPayments', 'success', 
      { agreementId }, 'Fixing payment records for agreement');
    
    // First, get all payments for this agreement
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asTableId('unified_payments', agreementId))
      .order('original_due_date', { ascending: true });
    
    if (paymentsError) {
      logOperation('paymentSchedule.fixAgreementPayments', 'error', 
        { agreementId, error: paymentsError.message }, 'Error fetching payments');
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
        logOperation('paymentSchedule.fixAgreementPayments', 'warning', 
          { agreementId, month, count: monthlyPayments.length }, 
          `Found multiple payments for month`);
        
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
            logOperation('paymentSchedule.fixAgreementPayments', 'error', 
              { agreementId, paymentId: duplicate.id, error: deleteError.message }, 
              'Error deleting duplicate payment');
          } else {
            logOperation('paymentSchedule.fixAgreementPayments', 'success', 
              { agreementId, paymentId: duplicate.id }, 
              'Successfully deleted duplicate payment');
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
    logOperation('paymentSchedule.fixAgreementPayments', 'error', 
      { agreementId, error: error instanceof Error ? error.message : String(error) }, 
      'Error in payment record fixing');
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
