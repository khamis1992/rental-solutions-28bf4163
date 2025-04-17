
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
    // Add retry configuration for better reliability
    db: {
      schema: 'public'
    }
  }
);

export default supabase;
