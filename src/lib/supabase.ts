
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

export { supabase as default };
