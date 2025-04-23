import { createClient } from '@supabase/supabase-js'
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';
import { toast } from 'sonner';
import { ensureAllMonthlyPayments } from '@/lib/payment-utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const checkAndGenerateMonthlyPayments = async (): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log('Checking for monthly payments to generate');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Find active agreements that might need payments generated
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date, rent_due_day')
      .in('status', ['active', 'pending_payment'])
      .lte('start_date', lastDayOfMonth.toISOString())
      .is('payment_status', null);
    
    if (agreementsError) {
      console.error('Error fetching active agreements:', agreementsError);
      return { success: false, message: 'Error fetching agreements', error: agreementsError };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log('No agreements require payment generation');
      return { success: true, message: 'No payments needed to be generated' };
    }
    
    console.log(`Found ${activeAgreements.length} agreements that might need payments generated`);
    
    let generatedCount = 0;
    
    // For each agreement, check if we need to generate a payment for current month
    for (const agreement of activeAgreements) {
      // Check if payment already exists for this month
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreement.id)
        .gte('payment_date', firstDayOfMonth.toISOString())
        .lt('payment_date', lastDayOfMonth.toISOString());
        
      if (paymentsError) {
        console.error(`Error checking existing payments for agreement ${agreement.id}:`, paymentsError);
        continue;
      }
      
      if (existingPayments && existingPayments.length > 0) {
        console.log(`Payment already exists for agreement ${agreement.id} this month`);
        continue;
      }
      
      // No payment exists for this month, generate one
      const dueDay = agreement.rent_due_day || 1;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      
      // If due date is in the past for this month, set status to overdue
      const paymentStatus = dueDate < today ? 'overdue' : 'pending';
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const { data: newPayment, error: createError } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: agreement.id,
          amount: agreement.rent_amount,
          description: `Monthly Rent - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          type: 'Income',
          status: paymentStatus,
          payment_date: null,
          due_date: dueDate.toISOString(),
          days_overdue: daysOverdue
        })
        .select()
        .single();
        
      if (createError) {
        console.error(`Error creating payment for agreement ${agreement.id}:`, createError);
        continue;
      }
      
      generatedCount++;
      console.log(`Generated payment for agreement ${agreement.id}`);
    }
    
    return { 
      success: true, 
      message: `Successfully generated ${generatedCount} monthly payments` 
    };
  } catch (err) {
    console.error('Unexpected error in checkAndGenerateMonthlyPayments:', err);
    return { 
      success: false, 
      message: `Failed to generate payments: ${err.message}`,
      error: err 
    };
  }
};

export const fixImportedAgreementDates = async (importId: string): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log(`Fixing dates for import: ${importId}`);
    
    // Update the import record status to "fixing"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'fixing',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    // Call the RPC function to fix the dates
    const { data, error } = await supabase.rpc('fix_agreement_import_dates', {
      p_import_id: importId
    });
    
    if (error) {
      console.error('Error fixing agreement dates:', error);
      
      // Update import status back to its original state
      await supabase
        .from('agreement_imports')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', importId);
        
      return { 
        success: false, 
        message: `Failed to fix date formats: ${error.message}`,
        error 
      };
    }
    
    // Update the import status back to "completed"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    return { 
      success: true, 
      message: `Successfully fixed date formats for ${data?.fixed_count || 0} agreements` 
    };
  } catch (err) {
    console.error('Unexpected error in fixImportedAgreementDates:', err);
    
    // Update import status back to its original state
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
      
    return { 
      success: false, 
      message: `Unexpected error: ${err.message}`,
      error: err 
    };
  }
};

export const revertAgreementImport = async (
  importId: string, 
  reason: string = 'User-initiated revert'
): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log(`Reverting import: ${importId}, reason: ${reason}`);
    
    // Update the import record status to "reverting"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'reverting',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    // Call the RPC function to revert the import
    const { data, error } = await supabase.rpc('revert_agreement_import', {
      p_import_id: importId,
      p_reason: reason
    });
    
    if (error) {
      console.error('Error reverting import:', error);
      
      // Update import status back to its original state
      await supabase
        .from('agreement_imports')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', importId);
        
      return { 
        success: false, 
        message: `Failed to revert import: ${error.message}`,
        error 
      };
    }
    
    // Update the import status to "reverted"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'reverted',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    return { 
      success: true, 
      message: `Successfully reverted import. ${data?.deleted_count || 0} agreements removed.` 
    };
  } catch (err) {
    console.error('Unexpected error in revertAgreementImport:', err);
    
    // Update import status back to its original state
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
      
    return { 
      success: false, 
      message: `Unexpected error: ${err.message}`,
      error: err 
    };
  }
};

// Function to check for active agreements without payment schedules and create them
export const runPaymentScheduleMaintenanceJob = async (): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log("Running payment schedule maintenance job");
    
    // Check for active agreements without payment schedules and create them
    const result = await checkAndCreateMissingPaymentSchedules();
    
    if (!result.success) {
      console.error("Error in payment schedule maintenance job:", result.error);
      return {
        success: false,
        message: `Payment schedule maintenance job failed: ${result.message}`,
        error: result.error
      };
    }
    
    // Now update late fees for all pending payments
    const lateFeesResult = await updateLateFees();
    
    if (result.generatedCount > 0 || lateFeesResult.updatedCount > 0) {
      console.log(`Successfully generated ${result.generatedCount} payment schedules and updated ${lateFeesResult.updatedCount} late fees`);
    } else {
      console.log("No payment schedules needed to be generated or late fees updated");
    }
    
    return {
      success: true,
      message: `Payment schedule maintenance job completed successfully. ${result.message} Updated ${lateFeesResult.updatedCount} late fee amounts.`
    };
  } catch (error) {
    console.error("Unexpected error in payment schedule maintenance job:", error);
    return {
      success: false,
      message: `Unexpected error in payment schedule maintenance job: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Function to update late fees for pending payments
export const updateLateFees = async (): Promise<{ success: boolean; updatedCount: number; message?: string; error?: any }> => {
  try {
    console.log("Updating late fees for pending payments");
    
    // Get all pending payments with due dates in the past
    const { data: pendingPayments, error: fetchError } = await supabase
      .from('unified_payments')
      .select('id, lease_id, original_due_date, amount, days_overdue, late_fine_amount, daily_late_fee')
      .eq('status', 'pending')
      .lt('original_due_date', new Date().toISOString());
    
    if (fetchError) {
      console.error("Error fetching pending payments:", fetchError);
      return {
        success: false,
        updatedCount: 0,
        message: `Error fetching pending payments: ${fetchError.message}`,
        error: fetchError
      };
    }
    
    if (!pendingPayments || pendingPayments.length === 0) {
      console.log("No pending payments found that need late fee updates");
      return {
        success: true,
        updatedCount: 0,
        message: "No pending payments need late fee updates"
      };
    }
    
    console.log(`Found ${pendingPayments.length} pending payments to update`);
    
    let updatedCount = 0;
    
    // Update each payment with current late fee calculation
    for (const payment of pendingPayments) {
      const dueDate = new Date(payment.original_due_date);
      const today = new Date();
      
      // Calculate days overdue (excluding time portion)
      const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      const diffTime = todayNoTime.getTime() - dueDateNoTime.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Skip if days overdue hasn't changed
      if (daysOverdue <= (payment.days_overdue || 0)) {
        continue;
      }
      
      // Get daily late fee from the payment or lease, or use default
      let dailyLateFee = payment.daily_late_fee;
      
      if (!dailyLateFee) {
        // Try to get daily_late_fee from the lease
        const { data: leaseData } = await supabase
          .from('leases')
          .select('daily_late_fee')
          .eq('id', payment.lease_id)
          .single();
        
        dailyLateFee = leaseData?.daily_late_fee || 120; // Default to 120 QAR if not specified
      }
      
      // Calculate late fee (capped at 3000 QAR)
      const lateFineAmount = Math.min(daysOverdue * dailyLateFee, 3000);
      
      // Update the payment record
      const { error: updateError } = await supabase
        .from('unified_payments')
        .update({
          days_overdue: daysOverdue,
          late_fine_amount: lateFineAmount
        })
        .eq('id', payment.id);
      
      if (updateError) {
        console.error(`Error updating payment ${payment.id}:`, updateError);
        continue;
      }
      
      updatedCount++;
    }
    
    return {
      success: true,
      updatedCount,
      message: `Updated late fees for ${updatedCount} payments`
    };
  } catch (error) {
    console.error("Unexpected error in updateLateFees:", error);
    return {
      success: false,
      updatedCount: 0,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Function to manually run the maintenance job (can be called from UI)
export const manuallyRunPaymentMaintenance = async (): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    toast.info("Running payment schedule maintenance...");
    const result = await runPaymentScheduleMaintenanceJob();
    
    if (result.success) {
      if (result.message?.includes("Generated 0 payment") && !result.message?.includes("Updated")) {
        toast.info(result.message || "All payment schedules are up to date");
      } else {
        toast.success(result.message || "Payment maintenance completed successfully");
      }
    } else {
      toast.error(result.message || "Payment maintenance failed");
    }
    
    return result;
  } catch (error) {
    console.error("Error in manual payment maintenance:", error);
    toast.error("Failed to run payment maintenance");
    return {
      success: false,
      message: `Manual payment maintenance failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Function to check and fix payments for a specific agreement
export const fixAgreementPayments = async (agreementId: string): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    toast.info("Checking and fixing payments for this agreement...");
    const result = await ensureAllMonthlyPayments(agreementId);
    
    if (result.success) {
      if ((result.generatedCount || 0) === 0 && (result.updatedCount || 0) === 0) {
        toast.info("All payment records are up to date");
      } else {
        toast.success(result.message || "Payment records fixed successfully");
      }
    } else {
      toast.error(result.message || "Failed to fix payment records");
    }
    
    return result;
  } catch (error) {
    console.error("Error fixing agreement payments:", error);
    toast.error("Failed to fix agreement payments");
    return {
      success: false,
      message: `Failed to fix agreement payments: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};
