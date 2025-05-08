
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
    // Fixed: Using string literal for function name
    const { data, error } = await supabase.rpc('get_server_time');
    
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
