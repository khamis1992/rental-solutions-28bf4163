
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://vqdlsidkucrownbfuouq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y'
);

/**
 * Runs a maintenance job to check and update payment schedules
 * This helps ensure all active agreements have proper payment schedules
 * 
 * @returns A promise that resolves when the maintenance job is complete
 */
export const runPaymentScheduleMaintenanceJob = async (): Promise<{ success: boolean, message: string }> => {
  try {
    console.log("Running payment schedule maintenance job");
    
    // Call the database function that handles payment schedule generation
    const { data, error } = await supabase.rpc('generate_missing_payment_records');
    
    if (error) {
      console.error("Error in payment schedule maintenance:", error);
      return { 
        success: false, 
        message: `Payment schedule maintenance failed: ${error.message}` 
      };
    }
    
    // Log the results
    console.log("Payment schedule maintenance completed successfully", data);
    return { 
      success: true, 
      message: "Payment schedule maintenance completed successfully" 
    };
  } catch (error) {
    console.error("Exception in payment schedule maintenance:", error);
    return { 
      success: false, 
      message: `Payment schedule maintenance exception: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Fixes payment records for a specific agreement
 * This function removes duplicate payment records and ensures correct payment schedules
 * 
 * @param agreementId The ID of the agreement to fix payments for
 * @returns A promise that resolves when the fix operation is complete
 */
export const fixAgreementPayments = async (agreementId: string): Promise<{ success: boolean, message: string }> => {
  try {
    console.log(`Fixing payment records for agreement: ${agreementId}`);
    
    // Call the database function that handles payment fixing
    const { data, error } = await supabase.rpc('fix_duplicate_payment_records', { 
      lease_id_param: agreementId 
    });
    
    if (error) {
      console.error("Error fixing agreement payments:", error);
      return { 
        success: false, 
        message: `Failed to fix payment records: ${error.message}` 
      };
    }
    
    // Log the results
    console.log("Payment records fixed successfully", data);
    return { 
      success: true, 
      message: "Payment records fixed successfully" 
    };
  } catch (error) {
    console.error("Exception fixing payment records:", error);
    return { 
      success: false, 
      message: `Exception fixing payment records: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Manually run payment maintenance for all agreements
 * This is a wrapper around runPaymentScheduleMaintenanceJob for use in components
 * 
 * @returns A promise that resolves when the maintenance job is complete
 */
export const manuallyRunPaymentMaintenance = async (): Promise<{ success: boolean, message: string }> => {
  return runPaymentScheduleMaintenanceJob();
};

/**
 * Checks and generates monthly payments
 * This function calls the Supabase RPC function to generate missing payment records
 * 
 * @returns A promise that resolves when the check and generation is complete
 */
export const checkAndGenerateMonthlyPayments = async (): Promise<{ success: boolean, message: string }> => {
  try {
    console.log("Checking and generating monthly payments");
    
    // Call the Supabase RPC function to generate missing payment records
    const { data, error } = await supabase.rpc('generate_missing_payment_records');
    
    if (error) {
      console.error("Error generating monthly payments:", error);
      return { 
        success: false, 
        message: `Failed to generate monthly payments: ${error.message}` 
      };
    }
    
    console.log("Monthly payments generation completed successfully", data);
    return { 
      success: true, 
      message: "Monthly payments generated successfully" 
    };
  } catch (error) {
    console.error("Exception in monthly payments generation:", error);
    return { 
      success: false, 
      message: `Exception generating monthly payments: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

export { supabase as default };
