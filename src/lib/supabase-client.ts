// Re-export the enhanced Supabase client and related functions
import { supabase as enhancedSupabase, checkSupabaseHealth, checkConnectionWithRetry, monitorDatabaseConnection } from '@/integrations/supabase/client';

// Export the enhanced client with a different name
export { enhancedSupabase, checkSupabaseHealth, checkConnectionWithRetry, monitorDatabaseConnection };

// Also export the original client for backward compatibility
import { supabase } from '@/lib/supabase';
export { supabase };
