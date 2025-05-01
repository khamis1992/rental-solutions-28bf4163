
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns boolean indicating if the table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count(*)')
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
};

/**
 * Creates a safe database transaction wrapper
 * @param callback The database operation to execute
 * @returns Result of the database operation
 */
export const safeDbOperation = async <T>(
  callback: () => Promise<T>,
  options: {
    errorMessage?: string;
    showToast?: boolean;
    logError?: boolean;
  } = { showToast: true, logError: true }
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const result = await callback();
    return { success: true, data: result };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown database error';
    
    if (options.logError !== false) {
      console.error('Database operation failed:', error);
    }

    if (options.showToast !== false) {
      toast.error(options.errorMessage || 'Database operation failed');
    }

    return { success: false, error };
  }
};

/**
 * Updates a database record with automatic error handling
 */
export const updateRecord = async <T = any>(
  table: string,
  id: string,
  data: Record<string, any>,
  options: {
    select?: string;
    errorMessage?: string;
    successMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  return safeDbOperation(async () => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select(options.select || '*')
      .single();

    if (error) throw new Error(error.message);
    
    if (options.showToast !== false && options.successMessage) {
      toast.success(options.successMessage);
    }
    
    return result as T;
  }, {
    errorMessage: options.errorMessage,
    showToast: options.showToast
  });
};

/**
 * Retrieves a single record by ID with error handling
 */
export const getRecordById = async <T = any>(
  table: string,
  id: string,
  options: {
    select?: string;
    errorMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  return safeDbOperation(async () => {
    const { data: result, error } = await supabase
      .from(table)
      .select(options.select || '*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return result as T;
  }, {
    errorMessage: options.errorMessage,
    showToast: options.showToast
  });
};
