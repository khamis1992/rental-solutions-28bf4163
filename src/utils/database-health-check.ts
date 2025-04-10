
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Check the health of the Supabase connection
 * @returns Promise with health status and optional error message
 */
export const checkDatabaseHealth = async (): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    console.log('Checking database connection health');
    
    // Attempt to make a lightweight query to test the connection
    const { error } = await supabase
      .from('vehicles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database health check failed:', error);
      return { isHealthy: false, error: error.message };
    }
    
    console.log('Database connection is healthy');
    return { isHealthy: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    console.error('Database connection error:', errorMessage);
    return { isHealthy: false, error: errorMessage };
  }
};

/**
 * Check database health with retry logic
 * @param retries Number of retries to attempt
 * @param delay Milliseconds to wait between retries
 * @returns Promise resolving to boolean indicating connection status
 */
export const checkConnectionWithRetry = async (
  retries = 3, 
  delay = 1000
): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < retries) {
    const { isHealthy } = await checkDatabaseHealth();
    if (isHealthy) return true;
    
    attempts++;
    if (attempts < retries) {
      console.log(`Connection attempt ${attempts} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`Failed to connect to database after ${retries} attempts`);
  return false;
};

/**
 * Monitor database connectivity and show UI feedback
 * @param onConnectionChange Optional callback that runs when connection status changes
 * @param pollingIntervalMs How often to check connection (default: 30 seconds)
 * @returns Function to stop the monitoring
 */
export const monitorDatabaseConnection = (
  onConnectionChange?: (isConnected: boolean) => void,
  pollingIntervalMs = 30000
): () => void => {
  let previousStatus = true;
  
  const checkConnection = async () => {
    const { isHealthy, error } = await checkDatabaseHealth();
    
    // Only notify if the status has changed
    if (isHealthy !== previousStatus) {
      previousStatus = isHealthy;
      
      if (!isHealthy) {
        toast.error('Database connection lost', {
          description: `Cannot connect to database: ${error || 'Check your internet connection'}`,
        });
      } else {
        toast.success('Database connection restored', {
          description: 'Your connection to the database has been re-established',
        });
      }
      
      if (onConnectionChange) {
        onConnectionChange(isHealthy);
      }
    }
  };
  
  // Do an initial check
  checkConnection();
  
  // Set up regular polling
  const interval = setInterval(checkConnection, pollingIntervalMs);
  
  // Return function to clear the interval
  return () => clearInterval(interval);
};

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
