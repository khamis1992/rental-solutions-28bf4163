
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vqdlsidkucrownbfuouq.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Also export the client type for receipt scanner
export type Client = typeof supabase;
