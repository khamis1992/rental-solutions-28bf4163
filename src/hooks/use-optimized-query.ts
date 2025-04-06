
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const optimizedQueryFn = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const data = await queryFn();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request cancelled');
      }
      throw error;
    }
  }, [queryFn]);

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    ...options,
  });
}
