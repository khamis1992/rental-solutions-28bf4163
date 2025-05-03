
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { handleApiError } from '@/lib/api/error-api';
import { createQueryConfig } from '@/lib/api/query-config';

/**
 * Standardized hook for API queries with consistent error handling
 *
 * @param queryKey - The query key for React Query cache
 * @param queryFn - The function that fetches data
 * @param options - Additional options for the query
 * @returns UseQueryResult with data or error
 */
export function useApiQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    retry?: boolean | number;
    errorContext?: string;
    staleTime?: number;
    gcTime?: number;
  }
): UseQueryResult<TData | null, Error> {
  const { errorContext, ...queryOptions } = options || {};

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();

        if (response === null || response === undefined) {
          throw new Error('No data received from the server');
        }

        if (typeof response === 'object' && 'error' in response) {
          const supabaseResponse = response as { error: any; data: TData };
          if (supabaseResponse.error) {
            throw supabaseResponse.error;
          }
          return supabaseResponse.data;
        }

        return response;
      } catch (error) {
        handleApiError(error, errorContext || `Error fetching ${queryKey[0]}`);
        throw error;
      }
    },
    ...createQueryConfig(queryOptions)
  });
}
