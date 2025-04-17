import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database.types';

interface HealthCheckResult {
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Performs a health check on the database connection
 * @returns A promise that resolves to a health check result
 */
export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
  try {
    // Use a public API or method instead of accessing protected property
    // For example, use a query to check connection
    const healthCheck = await performHealthCheck();
    return healthCheck;
  } catch (error) {
    console.error("Database health check failed:", error);
    return { 
      status: 'error', 
      message: 'Unable to connect to database',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Performs the actual health check by running a simple query
 */
async function performHealthCheck(): Promise<HealthCheckResult> {
  try {
    // Run a simple query to check if the database is responsive
    const startTime = performance.now();
    const { data, error } = await supabase.from('system_settings').select('id').limit(1);
    const endTime = performance.now();
    
    if (error) {
      return {
        status: 'error',
        message: `Database query failed: ${error.message}`,
        details: { error },
        timestamp: new Date().toISOString()
      };
    }
    
    const responseTime = Math.round(endTime - startTime);
    
    // Check response time to determine if there might be performance issues
    let status: 'ok' | 'warning' = 'ok';
    let message = 'Database connection successful';
    
    if (responseTime > 1000) {
      status = 'warning';
      message = 'Database connection is slow';
    }
    
    return {
      status,
      message,
      details: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get connection information without exposing sensitive details
 */
export const getConnectionInfo = () => {
  return {
    status: 'connected',
    // Don't expose protected properties
    connectionDetails: 'Database connection established',
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if a specific table exists in the database
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Use RPC to check if table exists
    const { data, error } = await supabase.rpc('check_table_exists', {
      table_name: tableName
    });
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Failed to check if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Get the row count for a specific table
 */
export const getTableRowCount = async (tableName: keyof Database['public']['Tables']): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error getting row count for table ${tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Failed to get row count for table ${tableName}:`, error);
    return 0;
  }
};
