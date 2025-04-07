
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

/**
 * A wrapper around useQuery that adds caching functionality
 * 
 * @param queryKey The query key to use for caching
 * @param queryFn The query function to execute
 * @param options Additional options for the query
 * @returns The query result
 */
export function useQueryWithCache<
  TData = unknown,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
) {
  // Check if we have the data in localStorage
  const cacheKey = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // Execute the query function
        const data = await queryFn();
        
        // Store in localStorage if needed for offline support
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(
              `query-cache-${cacheKey}`,
              JSON.stringify({
                data,
                timestamp: Date.now(),
              })
            );
          } catch (e) {
            console.warn('Failed to cache query result:', e);
          }
        }
        
        return data;
      } catch (error) {
        // If offline and we have cached data, use it
        if (
          typeof localStorage !== 'undefined' &&
          (error instanceof Error && error.message.includes('network') || 
          navigator.onLine === false)
        ) {
          const cachedItem = localStorage.getItem(`query-cache-${cacheKey}`);
          if (cachedItem) {
            try {
              const { data, timestamp } = JSON.parse(cachedItem);
              // Only use cache if it's less than 24 hours old
              if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return data as TData;
              }
            } catch (e) {
              console.warn('Failed to parse cached data:', e);
            }
          }
        }
        
        throw error;
      }
    },
    // Setting reasonable defaults
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    ...options,
  });
}
