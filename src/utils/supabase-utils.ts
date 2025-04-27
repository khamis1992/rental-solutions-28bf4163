
import { TypedSupabaseClient } from '@/hooks/use-typed-supabase';
import { PostgrestResponse, PostgrestSingleResponse, PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Type-safe Supabase query executor with proper error handling
 * @param queryFn Function that performs the Supabase query
 * @param errorMessage Optional custom error message
 * @returns Query result or null on error
 */
export async function executeQuery<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  errorMessage?: string
): Promise<T | T[] | null> {
  try {
    const response = await queryFn();
    
    if (response.error) {
      console.error(errorMessage || 'Database query error:', response.error);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(errorMessage || 'Unexpected error during database query:', error);
    return null;
  }
}

/**
 * Create a typed query builder with proper error handling
 * @param client TypedSupabaseClient instance
 * @param tableName Name of the table to query
 * @returns Collection of query methods
 */
export function createTypedQuery<T>(client: TypedSupabaseClient, tableName: string) {
  return {
    getById: async (id: string): Promise<T | null> => {
      return executeQuery<T>(
        () => client.from(tableName).select('*').eq('id', id).single(),
        `Error fetching ${tableName} with ID ${id}`
      ) as Promise<T | null>;
    },
    
    findMany: async (filters?: Record<string, any>): Promise<T[] | null> => {
      let query = client.from(tableName).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      return executeQuery<T[]>(
        () => query,
        `Error fetching ${tableName} with filters`
      ) as Promise<T[] | null>;
    },
    
    create: async (data: any): Promise<T | null> => {
      return executeQuery<T>(
        () => client.from(tableName).insert(data).select().single(),
        `Error creating ${tableName}`
      ) as Promise<T | null>;
    },
    
    update: async (id: string, data: any): Promise<T | null> => {
      return executeQuery<T>(
        () => client.from(tableName).update(data).eq('id', id).select().single(),
        `Error updating ${tableName} with ID ${id}`
      ) as Promise<T | null>;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const result = await executeQuery<any>(
        () => client.from(tableName).delete().eq('id', id),
        `Error deleting ${tableName} with ID ${id}`
      );
      
      return result !== null;
    }
  };
}

/**
 * Type guard to check if a response has data and no error
 * @param response Supabase response to check
 * @returns Type predicate for valid response
 */
export function isValidResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && response.data);
}

/**
 * Safe handler for Supabase mutations with toast notifications
 * @param mutationFn Function that performs the mutation
 * @param options Configuration options
 * @returns Result of the mutation or null on error
 */
export async function safeMutation<T>(
  mutationFn: () => Promise<PostgrestSingleResponse<T>>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    showToasts?: boolean;
  } = {}
): Promise<T | null> {
  const { 
    successMessage = 'Operation completed successfully', 
    errorMessage = 'Operation failed', 
    showToasts = true 
  } = options;
  
  try {
    const { data, error } = await mutationFn();
    
    if (error) {
      console.error('Mutation error:', error);
      if (showToasts) toast.error(errorMessage);
      return null;
    }
    
    if (showToasts) toast.success(successMessage);
    return data;
  } catch (error) {
    console.error('Unexpected error during mutation:', error);
    if (showToasts) toast.error(errorMessage);
    return null;
  }
}
