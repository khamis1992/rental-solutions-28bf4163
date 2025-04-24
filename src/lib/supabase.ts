
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function runPaymentScheduleMaintenanceJob() {
  try {
    const { data, error } = await supabase.functions.invoke('payment-schedule-maintenance');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error running payment schedule maintenance job:', error);
    throw error;
  }
}

export default supabase;
