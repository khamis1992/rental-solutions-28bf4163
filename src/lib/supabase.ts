
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';
import { asTableId } from '@/lib/database-helpers';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Connection status cache to avoid repeated health checks
let lastHealthCheck = {
  timestamp: 0,
  isHealthy: true,
  error: null as string | null,
};
const HEALTH_CACHE_TTL = 5000; // 5 seconds

/**
 * Test the database connection with caching
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    if (now - lastHealthCheck.timestamp < HEALTH_CACHE_TTL) {
      return lastHealthCheck.isHealthy;
    }

    const { error } = await supabase.from('vehicles').select('count', {
      count: 'exact',
      head: true,
    });

    const isHealthy = !error;
    lastHealthCheck = {
      timestamp: now,
      isHealthy,
      error: error ? error.message : null,
    };

    return isHealthy;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    lastHealthCheck = {
      timestamp: Date.now(),
      isHealthy: false,
      error: err instanceof Error ? err.message : 'Unknown connection error',
    };
    return false;
  }
};

/**
 * Detailed health check with retries and latency measurement
 */
export const checkSupabaseHealth = async (): Promise<{
  isHealthy: boolean;
  error?: string;
  latency?: number;
  timestamp: number;
  connectionCount?: number;
}> => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  try {
    const now = Date.now();
    if (now - lastHealthCheck.timestamp < HEALTH_CACHE_TTL) {
      return {
        isHealthy: lastHealthCheck.isHealthy,
        error: lastHealthCheck.error || undefined,
        timestamp: lastHealthCheck.timestamp,
      };
    }

    let error: any = null;
    let isHealthy = false;
    const startTime = performance.now();

    while (retryCount < MAX_RETRIES && !isHealthy) {
      try {
        if (retryCount === 0) {
          const res = await supabase.from('vehicles').select('count', {
            count: 'exact',
            head: true,
          });
          error = res.error;
        } else if (retryCount === 1) {
          const res = await supabase.from('vehicle_types').select('count', {
            count: 'exact',
            head: true,
          });
          error = res.error;
        } else {
          const res = await supabase.rpc('get_server_time');
          error = res.error;
        }

        isHealthy = !error;
        if (isHealthy) break;

        console.log(
          `Health check attempt ${retryCount + 1} failed: ${error?.message}`,
        );
        retryCount++;
        await new Promise((r) => setTimeout(r, 500 * retryCount));
      } catch (err) {
        error = err;
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * retryCount));
        }
      }
    }

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!isHealthy) {
      console.error('All Supabase health check attempts failed:', error);
      lastHealthCheck = {
        timestamp: now,
        isHealthy: false,
        error: error
          ? error instanceof Error
            ? error.message
            : String(error)
          : 'Unknown database error',
      };
      return {
        isHealthy: false,
        error:
          error && error instanceof Error
            ? error.message
            : error
              ? String(error)
              : 'Unknown database error',
        latency,
        timestamp: now,
      };
    }

    lastHealthCheck = {
      timestamp: now,
      isHealthy: true,
      error: null,
    };

    return { isHealthy: true, latency, timestamp: now };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error checking Supabase connection';
    console.error('Supabase connection error:', errorMessage);
    lastHealthCheck = {
      timestamp: Date.now(),
      isHealthy: false,
      error: errorMessage,
    };
    return {
      isHealthy: false,
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
};

/**
 * Retry connection attempts with exponential backoff
 */
export const checkConnectionWithRetry = async (
  retries = 3,
  initialDelay = 1000,
): Promise<boolean> => {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < retries) {
    const { isHealthy } = await checkSupabaseHealth();
    if (isHealthy) return true;

    attempts++;
    if (attempts < retries) {
      console.log(`Connection attempt ${attempts} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 10000);
    }
  }

  console.error(`Failed to connect to database after ${retries} attempts`);
  return false;
};

/**
 * Monitor database connectivity and show UI notifications
 */
export const monitorDatabaseConnection = (
  onConnectionChange?: (status: { isConnected: boolean; error?: string }) => void,
  pollingIntervalMs = 30000,
): (() => void) => {
  let previousStatus = true;

  const checkConnection = async () => {
    const { isHealthy, error, latency } = await checkSupabaseHealth();
    if (isHealthy !== previousStatus) {
      previousStatus = isHealthy;

      if (!isHealthy) {
        console.error(`Database connection lost: ${error}`);
        toast.error('Database connection lost', {
          description: `Cannot connect to database: ${error || 'Check your internet connection'}`,
          duration: 0,
          id: 'db-connection-error',
        });
      } else {
        console.log(`Database connection restored (latency: ${latency}ms)`);
        toast.success('Database connection restored', {
          description: 'Your connection to the database has been re-established',
          id: 'db-connection-error',
        });
      }

      if (onConnectionChange) {
        onConnectionChange({ isConnected: isHealthy, error });
      }
    }
  };

  checkConnection();
  const interval = setInterval(checkConnection, pollingIntervalMs);
  return () => clearInterval(interval);
};

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
