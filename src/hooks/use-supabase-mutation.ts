// @ts-nocheck
/* eslint-disable */
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Result, createSuccessResult, createErrorResult } from '@/lib/errors/types';
import { toAppError } from '@/lib/errors/error-handler';
import { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

// Type for handling Supabase mutation response with proper error typing
type SupabaseMutationResult<T> = Result<T>;

// Type for mutation function that returns a Result
type MutationFunctionWithResult<TData, TVariables> = (
  variables: TVariables
) => Promise<SupabaseMutationResult<TData>>;

// Hook for executing Supabase mutations with proper error handling
export function useSupabaseMutation<TData = unknown, TVariables = unknown, TError = Error>(
  mutationFn: MutationFunctionWithResult<TData, TVariables>,
  options?: Omit<UseMutationOptions<SupabaseMutationResult<TData>, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<SupabaseMutationResult<TData>, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

// Type-safe mutation builder for database tables
export function createTableMutation<T extends keyof Database['public']['Tables']>(
  table: T,
  operation: 'insert' | 'update' | 'delete'
) {
  return async (
    data: Database['public']['Tables'][T]['Insert'] | Database['public']['Tables'][T]['Update']
  ): Promise<SupabaseMutationResult<Database['public']['Tables'][T]['Row']>> => {
    try {
      let query = supabase.from(table);

      switch (operation) {
        case 'insert':
          query = query.insert(data as Database['public']['Tables'][T]['Insert']);
          break;
        case 'update':
          query = query.update(data as Database['public']['Tables'][T]['Update']);
          break;
        case 'delete':
          query = query.delete();
          break;
      }

      const response = await query.select();
      
      if (response.error) {
        const error = toAppError(response.error);
        console.error(`Error performing ${operation} on ${table}:`, error);
        return createErrorResult<Database['public']['Tables'][T]['Row']>(error);
      }

      if (!response.data) {
        const error = toAppError(new Error(`No data returned from ${operation} operation`));
        console.warn(error.message);
        return createErrorResult<Database['public']['Tables'][T]['Row']>(error);
      }

      return createSuccessResult(response.data);
    } catch (error) {
      const appError = toAppError(error);
      console.error(`Unexpected error during ${operation} on ${table}:`, appError);
      return createErrorResult<Database['public']['Tables'][T]['Row']>(appError);
    }
  };
}

// Helper to handle mutation errors
export function handleMutationError<T>(error: unknown): SupabaseMutationResult<T> {
  const appError = toAppError(error);
  console.error('Mutation error:', appError);
  return createErrorResult<T>(appError);
}

// Helper to validate mutation data
export function validateMutationData<T>(data: T | null | undefined): SupabaseMutationResult<T> {
  if (!data) {
    const error = toAppError(new Error('Invalid mutation data'));
    console.warn(error.message);
    return createErrorResult<T>(error);
  }
  return createSuccessResult(data);
}

// Helper to handle optimistic updates
export function handleOptimisticUpdate<T>(
  oldData: T | null | undefined,
  newData: Partial<T>
): SupabaseMutationResult<T> {
  if (!oldData) {
    const error = toAppError(new Error('Cannot perform optimistic update without existing data'));
    console.warn(error.message);
    return createErrorResult<T>(error);
  }
  return createSuccessResult({ ...oldData, ...newData } as T);
} 