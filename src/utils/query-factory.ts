import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errors/error-handler';

/**
 * Options for creating a query
 */
interface QueryFactoryOptions<TData, TError> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: boolean | number;
  retryDelay?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  errorContext?: string;
  [key: string]: any;
}

/**
 * Factory function to create queries with consistent behavior for error handling
 * @param queryKey The query key for React Query cache
 * @param queryFn The function that fetches data
 * @param options Configuration options
 */
export function createQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: QueryFactoryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        // Handle the error with our centralized error handler
        handleApiError(error, options?.errorContext);
        throw error;
      }
    },
    ...options
  });
}

/**
 * Creates a query that auto-retries on specific error conditions
 * @param queryKey The query key for React Query cache
 * @param queryFn The function that fetches data
 * @param options Configuration options
 */
export function createResilientQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: QueryFactoryOptions<TData, TError> & {
    /** Maximum number of retries */
    maxRetries?: number;
    /** Whether to show error toasts for transient errors */
    silentRetry?: boolean;
  }
): UseQueryResult<TData, TError> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        // Handle the error with our centralized error handler, but only if not silent
        if (!options?.silentRetry) {
          handleApiError(error, options?.errorContext);
        } else {
          console.error(`Silent error in query ${queryKey.join('/')}:`, error);
        }
        throw error;
      }
    },
    retry: options?.maxRetries ?? 3,
    ...options
  });
}

/**
 * Creates a conditional query that only executes when enabled
 * @param queryKey The query key for React Query cache
 * @param queryFn The function that fetches data
 * @param enabled Whether the query should execute
 * @param options Configuration options
 */
export function createConditionalQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  enabled: boolean,
  options?: QueryFactoryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  return createQuery(queryKey, queryFn, { 
    ...options,
    enabled 
  });
}
