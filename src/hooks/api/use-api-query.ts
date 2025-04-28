
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { createQueryConfig } from '@/lib/api/query-config';
import { handleApiError } from '@/lib/api/error-handlers';

/**
 * Custom hook for API queries with standardized configuration and error handling
 * 
 * @param queryKey - The React Query key for caching
 * @param queryFn - The function that fetches data
 * @param options - Additional React Query options
 * @returns The result from useQuery with proper error handling
 */
export function useApiQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    ...createQueryConfig(options),
    ...options
  });
}
