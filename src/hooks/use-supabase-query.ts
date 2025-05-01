import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { hasResponseData, safeQueryToServiceResponse } from '@/utils/supabase-type-helpers';
import { withTimeout, withTimeoutAndRetry, chainOperations } from '@/utils/promise-utils';
import { ServiceResponse } from '@/utils/response-handler';

// Define helper types for improved type safety
type DbTables = Database['public']['Tables'];
type TableName = keyof DbTables;

interface QueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: boolean | number;
  timeout?: number;
  operationName?: string;
}

export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<T | null>,
  options?: QueryOptions
): UseQueryResult<T | null, Error> => {
  // Extract timeout options
  const { timeout, operationName, ...queryOptions } = options || {};
  
  // If timeout is specified, wrap the query function with our timeout utility
  const wrappedQueryFn = timeout
    ? async () => {
        const result = await withTimeout(
          queryFn(), 
          timeout,
          operationName || `Query ${key.join('/')}`
        );
        
        if (!result.success) {
          throw result.error || new Error('Query failed');
        }
        
        return result.data;
      }
    : queryFn;

  return useQuery({
    queryKey: key,
    queryFn: wrappedQueryFn,
    ...queryOptions,
  });
};

export const useSupabaseMutation = <T>(
  mutationFn: (data: any) => Promise<T | null>,
  options?: {
    timeout?: number;
    operationName?: string;
    retries?: number;
  }
) => {
  const { timeout = 10000, operationName = 'Mutation', retries = 0 } = options || {};
  
  // Wrap mutation function with timeout and retry handling
  const wrappedMutationFn = async (data: any) => {
    const result = await withTimeoutAndRetry(
      () => mutationFn(data),
      {
        timeoutMs: timeout,
        operationName,
        retries
      }
    );
    
    if (!result.success) {
      throw result.error || new Error('Mutation failed');
    }
    
    return result.data;
  };

  return useMutation({
    mutationFn: wrappedMutationFn,
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });
};

/**
 * Type-safe helper for creating Supabase filters
 */
export function createFilter<T extends keyof any>(
  column: T, 
  value: any
): { column: T, value: any } {
  return { column, value };
}

/**
 * Create a type-safe Supabase query builder with timeout handling
 */
export function createTypedQuery<T, TableName extends keyof Database['public']['Tables']>(
  tableName: TableName,
  options?: {
    timeout?: number;
    retries?: number;
  }
) {
  const { timeout = 8000, retries = 0 } = options || {};
  
  return {
    select: async (columns: string = '*') => {
      const result = await withTimeoutAndRetry(
        () => supabase.from(tableName).select(columns),
        { 
          timeoutMs: timeout,
          operationName: `${String(tableName)} select`,
          retries
        }
      );
      
      if (!result.success || !result.data) {
        console.error(`Error in ${tableName} select:`, result.error);
        return null;
      }
      
      return result.data as T[];
    },
    
    getById: async (id: string, columns: string = '*') => {
      const result = await withTimeoutAndRetry(
        () => supabase.from(tableName).select(columns).eq('id', id).single(),
        { 
          timeoutMs: timeout,
          operationName: `${String(tableName)} getById`,
          retries
        }
      );
      
      if (!result.success || !result.data) {
        console.error(`Error in ${tableName} getById:`, result.error);
        return null;
      }
      
      return result.data as T;
    },
    
    filter: async (filters: Array<{ column: string, value: any }>, columns: string = '*') => {
      const operation = async () => {
        let query = supabase.from(tableName).select(columns);
          
        for (const filter of filters) {
          query = query.eq(filter.column, filter.value);
        }
        
        return query;
      };
      
      const result = await withTimeoutAndRetry(
        operation,
        { 
          timeoutMs: timeout,
          operationName: `${String(tableName)} filter`,
          retries
        }
      );
      
      if (!result.success || !result.data) {
        console.error(`Error in ${tableName} filter:`, result.error);
        return null;
      }
      
      return result.data as T[];
    }
  };
}

/**
 * Chain multiple Supabase operations with proper error handling and timeouts
 * This reduces the need for sequential try/catch blocks and handles the 
 * conversion between different response formats
 * 
 * @param operations Array of database operations to chain
 * @param options Configuration for timeout and retry behavior
 * @returns Service response with the final result or an error
 */
export async function chainDatabaseOperations<T>(
  operations: Array<() => Promise<any>>,
  options?: {
    timeoutMs?: number;
    operationName?: string;
    retries?: number;
  }
): Promise<ServiceResponse<T>> {
  const { timeoutMs = 10000, operationName = 'Database operations', retries = 0 } = options || {};
  
  // Convert regular functions to ones that return ServiceResponse
  const wrappedOperations = operations.map((fn, index) => {
    return async (prevResult?: any) => {
      // For first operation, don't pass any arguments
      if (index === 0) {
        return safeQueryToServiceResponse(fn, `${operationName} - step ${index + 1}`);
      } 
      // For subsequent operations, pass previous result as argument
      return safeQueryToServiceResponse(() => fn(prevResult), `${operationName} - step ${index + 1}`);
    };
  });
  
  return withTimeoutAndRetry(
    () => chainOperations(...wrappedOperations),
    { 
      timeoutMs,
      operationName,
      retries
    }
  );
}

/**
 * Optimized function to fetch a record by ID and then perform an action with it
 * This handles all the error handling and response processing in one place
 */
export async function fetchAndProcessRecord<T, R>(
  tableName: string,
  id: string,
  processFn: (record: T) => Promise<ServiceResponse<R>>,
  options?: {
    timeoutMs?: number;
    retries?: number;
    columns?: string;
  }
): Promise<ServiceResponse<R>> {
  const { timeoutMs = 10000, retries = 0, columns = '*' } = options || {};
  
  return chainDatabaseOperations<R>(
    [
      // First operation: fetch the record
      () => supabase
        .from(tableName)
        .select(columns)
        .eq('id', id)
        .single(),
      
      // Second operation: process the record
      (record: T) => processFn(record)
    ],
    {
      timeoutMs,
      operationName: `Fetch and process ${tableName}`,
      retries
    }
  );
}
