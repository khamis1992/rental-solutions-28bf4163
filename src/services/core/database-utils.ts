
import { supabase } from '@/integrations/supabase/client';
import { DbResult, Tables, isValidDbResponse } from './database-types';
import { toast } from 'sonner';

type TableName = keyof Tables;

/**
 * Type-safe database ID casting
 */
export function asDbId<T extends TableName>(
  tableName: T,
  id: string
): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

/**
 * Type-safe status casting
 */
export function asDbStatus<T extends TableName>(
  tableName: T,
  status: string
): Tables[T]['Row']['status'] {
  return status as Tables[T]['Row']['status'];
}

/**
 * Safely execute a database query with proper error handling
 */
export async function executeQuery<T>(
  queryFn: () => Promise<DbResult<T>>,
  errorMessage: string = 'Database operation failed'
): Promise<T | null> {
  try {
    const response = await queryFn();
    
    if (!isValidDbResponse(response)) {
      console.error(errorMessage, response.error);
      toast.error(errorMessage);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(errorMessage, error);
    toast.error(errorMessage);
    return null;
  }
}

/**
 * Type-safe query builder for table operations
 */
export function createTableQuery<T extends TableName>(tableName: T) {
  return {
    findById: async (id: string) => {
      const typedId = asDbId(tableName, id);
      return executeQuery<Tables[T]['Row']>(
        () => supabase.from(tableName).select('*').eq('id', typedId).single(),
        `Failed to fetch ${tableName} with ID ${id}`
      );
    },
    
    update: async (id: string, data: Partial<Tables[T]['Update']>) => {
      const typedId = asDbId(tableName, id);
      return executeQuery<Tables[T]['Row']>(
        () => supabase.from(tableName).update(data).eq('id', typedId).select().single(),
        `Failed to update ${tableName}`
      );
    },
    
    delete: async (id: string) => {
      const typedId = asDbId(tableName, id);
      return executeQuery<Tables[T]['Row']>(
        () => supabase.from(tableName).delete().eq('id', typedId).select().single(),
        `Failed to delete ${tableName}`
      );
    }
  };
}

