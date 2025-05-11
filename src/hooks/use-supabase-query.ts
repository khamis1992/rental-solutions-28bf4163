
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { QueryKey, QueryFunction } from '@tanstack/react-query';

// Type for handling Supabase response with proper error typing
type SupabaseQueryResult<T> = T | PostgrestError | null;

// Custom error type for type conversion errors
interface GenericStringError {
  message: string;
  error: true;
}

export function useSupabaseQuery<T>(
  queryKey: QueryKey,
  queryFn: QueryFunction<SupabaseQueryResult<T>>,
  options?: Omit<UseQueryOptions<SupabaseQueryResult<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function useSupabaseMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation({
    mutationFn,
    ...options,
  });
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
  
  // Return empty array with correct type cast, regardless of error type
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
