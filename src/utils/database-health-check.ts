import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  database: {
    status: 'ok' | 'error';
    message?: string;
  };
  api: {
    status: 'ok' | 'error';
    message?: string;
  };
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    database: { status: 'ok' },
    api: { status: 'ok' },
  };

  try {
    // Initialize Supabase client with dummy credentials to avoid actual DB access during URL check
    const supabaseDummy = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE5NTczNDkyMDB9.fkG_ZmvkEG6ui64_jRPP9xKI15w9N_5Mnlw9nW0Eo5c'
    );

    // Helper function to safely access the Supabase URL
    const getSupabaseUrl = () => {
      // Access the base URL through the REST URL which is public
      const restUrl = supabaseDummy.rest.url;
      // Extract the base URL from the REST URL
      return restUrl.split('/rest/')[0];
    };

    const supabaseUrl = getSupabaseUrl();

    if (!supabaseUrl) {
      result.database = {
        status: 'error',
        message: 'Supabase URL is not defined in environment variables.',
      };
    } else {
      result.database = { status: 'ok' };
    }
  } catch (error: any) {
    result.database = {
      status: 'error',
      message: `Failed to validate Supabase URL: ${error.message}`,
    };
  }

  try {
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE5NTczNDkyMDB9.fkG_ZmvkEG6ui64_jRPP9xKI15w9N_5Mnlw9nW0Eo5c'
    );
    const { data, error } = await supabaseService.from('vehicles').select('id').limit(1);

    if (error) {
      result.api = {
        status: 'error',
        message: `API health check failed: ${error.message}`,
      };
    } else {
      result.api = { status: 'ok' };
    }
  } catch (error: any) {
    result.api = {
      status: 'error',
      message: `Failed to connect to Supabase API: ${error.message}`,
    };
  }

  return result;
}
