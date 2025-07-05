import {
  type PostgrestError,
  type PostgrestResponse,
  type PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { QueryKey, QueryFunction } from '@tanstack/react-query';
import { Result, createSuccessResult, createErrorResult, isSuccessResult } from '@/lib/errors/types';
import { toAppError } from '@/lib/errors/error-handler';
import { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

// Type for handling Supabase response with proper error typing
type SupabaseQueryResult<T> = Result<T>;
type SupabaseArrayQueryResult<T> = Result<T[]>;

// Type for query function that returns a Result
type QueryFunctionWithResult<TData> = QueryFunction<SupabaseQueryResult<TData>, QueryKey>;

// Type for mutation function that returns a Result
type MutationFunctionWithResult<TData, TVariables> = (
  variables: TVariables
) => Promise<SupabaseQueryResult<TData>>;

// Hook for executing Supabase queries with proper error handling
export function useSupabaseQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: QueryFunctionWithResult<TData>,
  options?: Omit<UseQueryOptions<SupabaseQueryResult<TData>, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SupabaseQueryResult<TData>, TError>({
    queryKey,
    queryFn,
    ...options,
  });
}

// Hook for executing Supabase mutations with proper error handling
export function useSupabaseMutation<TData = unknown, TVariables = unknown, TError = Error>(
  mutationFn: MutationFunctionWithResult<TData, TVariables>,
  options?: Omit<UseMutationOptions<SupabaseQueryResult<TData>, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<SupabaseQueryResult<TData>, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

// Helper function to handle Supabase response with proper error handling
export function handleSupabaseResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): SupabaseQueryResult<T> {
  if (response.error) {
    const error = toAppError(response.error);
    console.error('Database query error:', error);
    return createErrorResult<T>(error);
  }

  if (!response.data) {
    const error = toAppError(new Error('No data returned from database query'));
    console.warn(error.message);
    return createErrorResult<T>(error);
  }

  return createSuccessResult(response.data);
}

// Helper to extract data from Supabase response
export function getResponseData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): T | null {
  if (response.error) {
    console.error('Supabase query error:', response.error);
    return null;
  }
  return response.data as T;
}

// Helper to check if a response is valid
export function isValidResponse<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { error: null; data: T } {
  return !response.error && response.data !== null;
}

// Helper to convert response to array safely
export function toArray<T>(data: T | T[] | null | undefined): T[] {
  if (data === null || data === undefined) {
    return [];
  }
  return Array.isArray(data) ? data : [data];
}

// Helper to handle both string errors and PostgrestError safely
export function handleQueryError<T>(error: string | PostgrestError | unknown): T[] {
  console.error('Query error:', error);
  return [] as T[];
}

// Helper to extract a single item from a response
export function extractSingleItem<T>(data: T | T[] | null): T | null {
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }
  return data;
}

// Type-safe query builder for database tables
export function createTableQuery<T extends keyof Database['public']['Tables']>(
  table: T,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
) {
  return async (): Promise<SupabaseArrayQueryResult<Database['public']['Tables'][T]['Row']>> => {
    try {
      let query = supabase.from(table).select(options?.select || '*');

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const response = await query;
      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error querying ${table}:`, error);
        return createErrorResult<Database['public']['Tables'][T]['Row'][]>(error);
      }

      if (!response.data) {
        const error = toAppError(new Error(`No data returned from ${table} query`));
        console.warn(error.message);
        return createErrorResult<Database['public']['Tables'][T]['Row'][]>(error);
      }

      return createSuccessResult(response.data);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Error querying ${table}:`, appError);
      return createErrorResult<Database['public']['Tables'][T]['Row'][]>(appError);
    }
  };
}
