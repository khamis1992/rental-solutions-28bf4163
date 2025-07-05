import { supabase } from '@/lib/supabase';
import { Result, createSuccessResult, createErrorResult, isSuccessResult } from '@/lib/errors/types';
import { toAppError } from '@/lib/errors/error-handler';
import { toast } from 'sonner';

export interface DatabaseHealthStatus {
  isHealthy: boolean;
  latency?: number;
  error?: string;
  apiEndpoint: string;
  clientVersion: string;
}

/**
 * Check Supabase database health
 * @returns Promise with health status information
 */
export async function checkSupabaseHealth(): Promise<Result<DatabaseHealthStatus>> {
  try {
    const startTime = performance.now();
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (error) {
      const appError = toAppError(error);
      console.error('Database health check failed:', appError);
      return createErrorResult<DatabaseHealthStatus>(appError);
    }

    return createSuccessResult({
      isHealthy: true,
      latency,
      apiEndpoint: supabase.supabaseUrl,
      clientVersion: '2.38.4' // Version of @supabase/supabase-js
    });
  } catch (error) {
    const appError = toAppError(error);
    console.error('Unexpected error during database health check:', appError);
    return createErrorResult<DatabaseHealthStatus>(appError);
  }
}

/**
 * Run diagnostic check of database connection for troubleshooting
 * @returns Promise with detailed diagnostic information
 */
export async function runDatabaseDiagnostics(): Promise<Result<DatabaseHealthStatus>> {
  try {
    const startTime = performance.now();
    const healthResult = await checkSupabaseHealth();
    const endTime = performance.now();
    
    if (!isSuccessResult(healthResult)) {
      return createErrorResult<DatabaseHealthStatus>({
        code: 'DATABASE_ERROR',
        message: healthResult.error.message,
        details: healthResult.error.details
      });
    }

    const health = healthResult.data;
    const latency = health.latency || Math.round(endTime - startTime);
    const error = health.error || undefined;

    return createSuccessResult({
      isHealthy: health.isHealthy,
      latency,
      error,
      apiEndpoint: health.apiEndpoint,
      clientVersion: health.clientVersion
    });
  } catch (error) {
    const appError = toAppError(error);
    console.error('Unexpected error during database diagnostics:', appError);
    return createErrorResult<DatabaseHealthStatus>(appError);
  }
}

/**
 * Check the health of the Supabase connection using the client's built-in health check
 * @returns Promise with health status and optional error message
 */
export const checkDatabaseHealth = async (): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    console.log('Checking database connection health');
    const result = await checkSupabaseHealth();
    
    if (!isSuccessResult(result)) {
      console.error('Database health check failed:', result.error);
      return { 
        isHealthy: false,
        error: result.error.message
      };
    }
    
    console.log(`Database connection is healthy (latency: ${result.data.latency}ms)`);
    return { 
      isHealthy: result.data.isHealthy,
      error: result.data.error
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    console.error('Database connection error:', errorMessage);
    return { isHealthy: false, error: errorMessage };
  }
};

// Re-export connection retry functionality from the client
export { checkConnectionWithRetry } from '@/lib/supabase';

/**
 * Monitor database connectivity and show UI feedback
 * @param onConnectionChange Optional callback that runs when connection status changes
 * @param pollingIntervalMs How often to check connection (default: 30 seconds)
 * @returns Function to stop the monitoring
 */
export { monitorDatabaseConnection } from '@/lib/supabase';

/**
 * Show database connection status in UI
 * @param isConnected Current connection status
 * @returns JSX element or null
 */
export const getConnectionErrorMessage = (isConnected: boolean): string | null => {
  if (!isConnected) {
    return 'Database connection error. Please check your internet connection and try again.';
  }
  return null;
};
