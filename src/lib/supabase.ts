
import { createClient } from '@supabase/supabase-js';
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

