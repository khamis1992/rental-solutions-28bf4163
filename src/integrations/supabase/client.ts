
import { createClient } from '@supabase/supabase-js'

// These are public values that can be exposed in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

/**
 * Checks if the Supabase connection is healthy
 * @returns Promise with connection status and latency
 */
export const checkSupabaseHealth = async (): Promise<{ isHealthy: boolean; error?: string; latency?: number }> => {
  try {
    const startTime = performance.now();
    
    // Use a simple query to test connection
    const { data, error } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);
    
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return { isHealthy: false, error: error.message, latency };
    }
    
    return { isHealthy: true, latency };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error checking connection';
    console.error('Supabase connection error:', errorMessage);
    return { isHealthy: false, error: errorMessage };
  }
};

/**
 * Attempts to connect to Supabase with retry logic
 * @param maxRetries Maximum number of retries before giving up
 * @returns Boolean indicating if connection was successful
 */
export const checkConnectionWithRetry = async (maxRetries = 3): Promise<boolean> => {
  let retries = 0;
  let connected = false;
  
  while (retries < maxRetries && !connected) {
    try {
      const { isHealthy } = await checkSupabaseHealth();
      
      if (isHealthy) {
        connected = true;
        console.log('Successfully connected to Supabase');
        return true;
      }
      
      retries++;
      console.warn(`Connection attempt ${retries} failed, retrying...`);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    } catch (error) {
      retries++;
      console.error(`Connection attempt ${retries} error:`, error);
      
      if (retries >= maxRetries) {
        console.error('Max retries reached. Could not connect to Supabase');
        return false;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  return connected;
};

/**
 * Sets up a periodic connection health check
 * @param onConnectionChange Callback function to handle connection status changes
 * @param checkInterval How often to check connection in milliseconds
 * @returns Function to stop monitoring
 */
export const monitorDatabaseConnection = (
  onConnectionChange?: (isConnected: boolean) => void,
  checkInterval = 30000
): () => void => {
  let lastStatus: boolean | null = null;
  
  const checkConnection = async () => {
    const { isHealthy } = await checkSupabaseHealth();
    
    // Only trigger callback if status has changed
    if (isHealthy !== lastStatus && onConnectionChange) {
      lastStatus = isHealthy;
      onConnectionChange(isHealthy);
    }
  };
  
  // Check immediately
  checkConnection();
  
  // Set up interval for regular checks
  const intervalId = setInterval(checkConnection, checkInterval);
  
  // Return function to stop monitoring
  return () => clearInterval(intervalId);
};
