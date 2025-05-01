
import { supabase, checkSupabaseHealth, checkConnectionWithRetry, monitorDatabaseConnection } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logOperation } from '@/utils/monitoring-utils';

/**
 * Check the health of the Supabase connection using the client's built-in health check
 * @returns Promise with health status and optional error message
 */
export const checkDatabaseHealth = async (): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    logOperation('databaseHealth.checkDatabaseHealth', 'success', 
      {}, 'Checking database connection health');
    const result = await checkSupabaseHealth();
    
    if (!result.isHealthy) {
      logOperation('databaseHealth.checkDatabaseHealth', 'error', 
        { error: result.error }, 'Database health check failed');
    } else {
      logOperation('databaseHealth.checkDatabaseHealth', 'success', 
        { latency: result.latency }, 'Database connection is healthy');
    }
    
    return { 
      isHealthy: result.isHealthy,
      error: result.error 
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    logOperation('databaseHealth.checkDatabaseHealth', 'error', 
      { error: errorMessage }, 'Database connection error');
    return { isHealthy: false, error: errorMessage };
  }
};

// Re-export connection retry functionality from the client
export { checkConnectionWithRetry } from '@/integrations/supabase/client';

/**
 * Monitor database connectivity and show UI feedback
 * @param onConnectionChange Optional callback that runs when connection status changes
 * @param pollingIntervalMs How often to check connection (default: 30 seconds)
 * @returns Function to stop the monitoring
 */
export { monitorDatabaseConnection } from '@/integrations/supabase/client';

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

/**
 * Run diagnostic check of database connection for troubleshooting
 * @returns Promise with detailed diagnostic information
 */
export const runDatabaseDiagnostics = async (): Promise<{
  isConnected: boolean;
  latency?: number;
  error?: string;
  apiEndpoint: string;
  clientVersion: string;
}> => {
  try {
    const startTime = performance.now();
    const health = await checkSupabaseHealth();
    const endTime = performance.now();
    
    return {
      isConnected: health.isHealthy,
      latency: health.latency || Math.round(endTime - startTime),
      error: health.error,
      apiEndpoint: supabase.supabaseUrl,
      clientVersion: '2.38.4' // Version of @supabase/supabase-js
    };
  } catch (err) {
    return {
      isConnected: false,
      error: err instanceof Error ? err.message : 'Unknown error during diagnostics',
      apiEndpoint: supabase.supabaseUrl,
      clientVersion: '2.38.4'
    };
  }
};
