
import { toast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';
import { useMutation, useQuery, UseQueryOptions, UseMutationOptions, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Standard error handler for API calls.
 * Use this to handle errors from Supabase and other API calls consistently.
 */
export function handleApiError(error: unknown, context?: string): void {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  
  // Handle specific error types
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (isPostgrestError(error)) {
    errorMessage = `Database error: ${error.message}`;
    
    // Handle specific database errors
    if (error.code === '23505') {
      errorMessage = 'A record with this information already exists.';
    } else if (error.code === '23503') {
      errorMessage = 'This record cannot be modified because it is referenced by other data.';
    } else if (error.code === '42P01') {
      errorMessage = 'Database table not found. Please contact support.';
    } else if (error.code === '42703') {
      errorMessage = 'Database column not found. Please contact support.';
    } else if (error.code === '28000') {
      errorMessage = 'Authentication failed. Please try signing in again.';
    } else if (error.code === '40001') {
      errorMessage = 'Database is temporarily unavailable. Please try again.';
    } else if (error.code === '57014') {
      errorMessage = 'Query timed out. Please try again with a simpler request.';
    }
  } else if (error && typeof error === 'object' && 'error' in error && 'data' in error) {
    // Handle Supabase specific errors
    const supabaseError = error as { error: { message?: string; details?: string }; data: any | null };
    errorMessage = supabaseError.error.message || supabaseError.error.details || 'Database operation failed';
  }
  
  // Add context to the error message if provided
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  // Show toast notification for the error
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
}

/**
 * Type guard to check if an error is a PostgrestError from Supabase
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Format validation errors from form submissions
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

/**
 * Standardized success handler
 */
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
  });
}

/**
 * Custom hook for API queries with standardized error handling
 * Enhanced with improved caching and stale time settings
 */
export function useApiQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, Error> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        
        // Safely handle null or undefined responses
        if (response === null || response === undefined) {
          throw new Error('No data received from the server');
        }
        
        // If response is a Supabase response, check for errors
        if (typeof response === 'object' && 'error' in response) {
          const supabaseResponse = response as { error: any; data: TData };
          if (supabaseResponse.error) {
            throw supabaseResponse.error;
          }
          return supabaseResponse.data;
        }
        
        return response;
      } catch (error) {
        handleApiError(error, `Error fetching ${queryKey[0]}`);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (['23505', '23503', '42P01', '42703'].includes(code)) {
          return false;
        }
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options
  });
}

/**
 * Custom hook for API mutations with standardized error and success handling
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    successMessage?: string;
  }
): UseMutationResult<TData, Error, TVariables, unknown> {
  return useMutation({
    mutationFn: async (variables) => {
      try {
        const result = await mutationFn(variables);
        if (options?.successMessage) {
          handleApiSuccess(options.successMessage);
        }
        return result;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onSettled: options?.onSettled
  });
}

/**
 * Custom hook for CRUD operations with standardized endpoint structure
 */
export function useCrudApi<TData, TInsert, TUpdate = Partial<TInsert>>(
  resourceName: string,
  endpoint: {
    getAll: () => Promise<TData[]>;
    getById: (id: string) => Promise<TData>;
    create: (data: TInsert) => Promise<TData>;
    update: (id: string, data: TUpdate) => Promise<TData>;
    delete: (id: string) => Promise<void>;
  }
) {
  const getAll = useApiQuery<TData[]>([resourceName], endpoint.getAll);
  
  const getById = (id: string) => useApiQuery<TData>(
    [resourceName, id],
    () => endpoint.getById(id)
  );
  
  const create = useApiMutation<TData, TInsert>(
    (data) => endpoint.create(data),
    { successMessage: `${resourceName} created successfully` }
  );
  
  const update = useApiMutation<TData, { id: string; data: TUpdate }>(
    ({ id, data }) => endpoint.update(id, data),
    { successMessage: `${resourceName} updated successfully` }
  );
  
  const remove = useApiMutation<void, string>(
    (id) => endpoint.delete(id),
    { successMessage: `${resourceName} deleted successfully` }
  );
  
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    // Add these aliases for compatibility with existing code
    useList: getAll, 
    useOne: getById,
    useCreate: create,
    useUpdate: update,
    useDelete: remove
  };
}
