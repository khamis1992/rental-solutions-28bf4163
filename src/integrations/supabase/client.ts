
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Configure the base URL and API key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Basic validation to prevent common issues
if (!supabaseUrl || supabaseUrl === 'your-project-url') {
  console.error('Invalid Supabase URL. Please check your environment variables.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('Invalid Supabase Anon Key. Please check your environment variables.');
}

// Create the Supabase client with custom options
const options: SupabaseClientOptions<'public'> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // These are standard fetch options
    headers: {
      'x-application-name': 'fleet-management-system',
    },
  },
};

// Create and export the typed client instance
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  options
);

/**
 * Check the health of the Supabase connection
 * @returns Promise with health status and latency
 */
export async function checkSupabaseHealth(): Promise<{ 
  isHealthy: boolean; 
  latency?: number; 
  error?: string 
}> {
  const startTime = performance.now();
  
  try {
    // Simple query to check database connection
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    // If table doesn't exist, try a different approach
    if (error && error.code === '42P01') {
      try {
        // Try using RPC function if available
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_server_timestamp');
        
        if (rpcError) {
          // Try system table as last resort
          const { error: sysError } = await supabase
            .from('pg_stat_activity')
            .select('pid')
            .limit(1);
            
          if (sysError) {
            return { 
              isHealthy: false, 
              error: `Database connection failed: ${sysError.message}` 
            };
          }
        }
      } catch (fallbackError) {
        // Last attempt: simple RLS-allowed query
        const { error: finalError } = await supabase.auth.getSession();
        if (finalError) {
          return { 
            isHealthy: false, 
            error: `Connection failed: ${finalError.message}` 
          };
        }
      }
    } else if (error) {
      return { 
        isHealthy: false, 
        error: `Database query failed: ${error.message}` 
      };
    }
    
    const endTime = performance.now();
    return { 
      isHealthy: true, 
      latency: Math.round(endTime - startTime) 
    };
  } catch (err) {
    return { 
      isHealthy: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Check connection with retry mechanism
 */
export async function checkConnectionWithRetry(
  maxRetries = 3, 
  delayMs = 1000
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const { isHealthy } = await checkSupabaseHealth();
    
    if (isHealthy) {
      return true;
    }
    
    attempts++;
    console.log(`Connection attempt ${attempts} failed, retrying...`);
    
    if (attempts < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempts));
    }
  }
  
  console.error(`Failed to connect after ${maxRetries} attempts`);
  return false;
}

/**
 * Monitor database connection status
 */
export function monitorDatabaseConnection(
  onConnectionChange?: (isConnected: boolean) => void,
  pollingIntervalMs = 30000
): () => void {
  let isConnected = true;
  let intervalId: number;
  
  const checkConnection = async () => {
    const { isHealthy } = await checkSupabaseHealth();
    
    if (isHealthy !== isConnected) {
      isConnected = isHealthy;
      if (onConnectionChange) {
        onConnectionChange(isConnected);
      }
    }
  };
  
  // Initial check
  checkConnection();
  
  // Set up polling
  intervalId = window.setInterval(checkConnection, pollingIntervalMs);
  
  // Return function to stop monitoring
  return () => {
    window.clearInterval(intervalId);
  };
}

// Helper function for database query errors
export function handleQueryError(error: any): string {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return error.message as string;
    }
    if ('error' in error) {
      return (error.error as any).message || 'Unknown database error';
    }
  }
  return 'An unexpected database error occurred';
}

// Helper function for RLS policy errors
export function isPermissionError(error: any): boolean {
  if (!error) return false;
  
  // Check for common RLS error codes
  if (typeof error === 'object' && 'code' in error) {
    return error.code === '42501' || error.message?.includes('permission denied');
  }
  
  return false;
}

// Get server timestamp (used for synchronizing client time)
export async function getServerTime(): Promise<Date | null> {
  try {
    // Fixing the issue with `get_server_time` function
    const { data, error } = await supabase.rpc('get_server_timestamp');
    
    if (error) {
      console.error('Error getting server time:', error);
      return null;
    }
    
    return new Date(data);
  } catch (error) {
    console.error('Failed to get server time:', error);
    return null;
  }
}

// Re-export for convenience
export default supabase;
