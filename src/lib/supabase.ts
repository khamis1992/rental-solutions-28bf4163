
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://vqdlsidkucrownbfuouq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y'
);

export { supabase as default };
