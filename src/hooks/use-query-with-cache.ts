
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { handleApiError } from '@/hooks/use-api';

/**
 * Generic query hook with optimized caching settings
 * 
 * @param queryKey - The key for this query
 * @param queryFn - The function that returns a promise resolving the data
 * @param options - Optional React Query options
 */
export function useQueryWithCache<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> = {}
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        handleApiError(error, `Error fetching ${queryKey[0]}`);
        throw error;
      }
    },
    // Default aggressive caching
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    retry: options.retry ?? 1,
    ...options
  });
}

/**
 * Query hook specifically tailored for dashboard components
 * with aggressive caching to minimize re-fetching
 */
export function useDashboardQuery<TData, TError = Error>(
  subKey: string,
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> = {}
) {
  return useQueryWithCache<TData, TError>(
    ['dashboard', subKey],
    queryFn,
    {
      // Dashboard specific caching settings
      staleTime: 10 * 60 * 1000, // 10 minutes
      ...options
    }
  );
}

/**
 * Query hook for infrequently changing data like reference data
 * with very aggressive caching to minimize re-fetching
 */
export function useStaticQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> = {}
) {
  return useQueryWithCache<TData, TError>(
    queryKey,
    queryFn,
    {
      // Static data caching settings
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 30 * 24 * 60 * 60 * 1000, // 30 days
      ...options
    }
  );
}
