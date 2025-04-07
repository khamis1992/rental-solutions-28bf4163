import { useState } from 'react';
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
    }
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
        // Add performance monitoring
        const startTime = performance.now();
        console.debug(`API Query started: ${queryKey[0]}`);
        
        const result = await queryFn();
        
        const endTime = performance.now();
        console.debug(`API Query completed: ${queryKey[0]} in ${(endTime - startTime).toFixed(2)}ms`);
        
        return result;
      } catch (error) {
        handleApiError(error, `Error fetching ${queryKey[0]}`);
        throw error;
      }
    },
    // Add reasonable default staleTime to prevent excessive refreshing
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only refetch on window focus if data is stale
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
        // Add performance monitoring
        const startTime = performance.now();
        console.debug('API Mutation started');
        
        const result = await mutationFn(variables);
        
        const endTime = performance.now();
        console.debug(`API Mutation completed in ${(endTime - startTime).toFixed(2)}ms`);
        
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

// New hook for paginated data
export function usePaginatedApiQuery<TData>(
  queryKey: unknown[],
  fetchFn: (page: number, pageSize: number) => Promise<{ data: TData[], totalCount: number }>,
  options?: {
    initialPage?: number;
    pageSize?: number;
    enabled?: boolean;
    onSuccess?: (data: { data: TData[], totalCount: number }) => void;
    onError?: (error: Error) => void;
  }
): {
  data: TData[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
} {
  const [page, setPage] = useState(options?.initialPage || 1);
  const [pageSize, setPageSize] = useState(options?.pageSize || 10);
  
  const queryResult = useApiQuery<{ data: TData[], totalCount: number }>(
    [...queryKey, page, pageSize],
    () => fetchFn(page, pageSize),
    {
      placeholderData: (oldData) => oldData,
      enabled: options?.enabled !== false,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
  
  return {
    data: queryResult.data?.data,
    totalCount: queryResult.data?.totalCount || 0,
    page,
    pageSize,
    setPage,
    setPageSize,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch
  };
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
