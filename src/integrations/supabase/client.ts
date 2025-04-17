
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Environment variables from vite.config.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file.',
    { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey }
  );
}

// Configure storage bucket
export const storageBucket = 'documents';

// Handle connection timeouts and retries
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Custom fetch with timeout
const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const { signal } = controller;

    // Set timeout to abort the request
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    // Create a safe options object, ensuring signal is included
    const safeOptions = {
      ...options,
      signal
    };

    fetch(url, safeOptions)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: fetchWithTimeout as typeof fetch
    },
    // Add configuration for better reliability
    db: {
      schema: 'public'
    }
  }
);

/**
 * Checks the health of the Supabase connection
 * @returns Promise with health status and optional error message
 */
export const checkSupabaseHealth = async (): Promise<{ 
  isHealthy: boolean; 
  error?: string;
  latency?: number;
}> => {
  try {
    const startTime = performance.now();
    
    // Simple query to check if the database is responsive
    const { data, error } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    if (error) {
      console.error('Supabase health check failed:', error);
      return { 
        isHealthy: false, 
        error: error.message,
        latency
      };
    }
    
    return { 
      isHealthy: true,
      latency
    };
  } catch (err) {
    console.error('Unexpected error during health check:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown database connection error';
    return { 
      isHealthy: false, 
      error: errorMessage
    };
  }
};

/**
 * Checks connection with retry logic
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with connection status
 */
export const checkConnectionWithRetry = async (maxRetries = 3): Promise<boolean> => {
  let retries = 0;
  let isConnected = false;
  
  while (retries < maxRetries && !isConnected) {
    const health = await checkSupabaseHealth();
    isConnected = health.isHealthy;
    
    if (!isConnected) {
      retries++;
      console.log(`Connection retry attempt ${retries}/${maxRetries}`);
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
    }
  }
  
  return isConnected;
};

/**
 * Sets up a periodic database connection monitor
 * @param onConnectionChange Callback function triggered when connection status changes
 * @param pollingIntervalMs How often to check connection (default: 30 seconds) 
 * @returns Function to stop monitoring
 */
export const monitorDatabaseConnection = (
  onConnectionChange?: (isConnected: boolean) => void,
  pollingIntervalMs = 30000
): (() => void) => {
  let isConnected = true; // Assume connected initially
  let intervalId: number | undefined;
  
  const checkConnection = async () => {
    const health = await checkSupabaseHealth();
    const newConnectionStatus = health.isHealthy;
    
    // Only notify if the status changed
    if (newConnectionStatus !== isConnected) {
      isConnected = newConnectionStatus;
      console.log(`Database connection status changed to: ${isConnected ? 'connected' : 'disconnected'}`);
      
      if (onConnectionChange) {
        onConnectionChange(isConnected);
      }
    }
  };
  
  // Initial check
  checkConnection();
  
  // Set up interval for periodic checks
  intervalId = window.setInterval(checkConnection, pollingIntervalMs);
  
  // Return function to stop monitoring
  return () => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
    }
  };
};

export default supabase;
