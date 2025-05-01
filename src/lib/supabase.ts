
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vqdlsidkucrownbfuouq.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Also export the client type for receipt scanner
export type Client = typeof supabase;

/**
 * Checks the health status of the Supabase connection
 * @returns Promise with health status and optional error message
 */
export const checkSupabaseHealth = async (): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        isHealthy: false,
        error: `Database error: ${error.message}`
      };
    }
    
    return { isHealthy: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      isHealthy: false,
      error: `Connection error: ${errorMessage}`
    };
  }
};

/**
 * Runs the payment schedule maintenance job to ensure all active agreements
 * have proper payment schedules created and any overdue payments are tracked.
 * 
 * @returns Promise with the job execution status
 */
export const runPaymentScheduleMaintenanceJob = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // Call the database function that generates missing payment records
    const { data, error } = await supabase.rpc('generate_missing_payment_records_with_qualified_columns');
    
    if (error) {
      throw new Error(`Payment schedule maintenance failed: ${error.message}`);
    }
    
    // Check data to see if any missing payments were found
    const recordCount = Array.isArray(data) ? data.length : 0;
    
    return {
      success: true,
      message: `Payment schedule maintenance completed successfully. ${recordCount} records were processed.`
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in payment schedule maintenance job:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
