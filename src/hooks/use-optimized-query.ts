import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { useCallback, useRef, useEffect } from 'react';
import { PerformanceMonitor } from '@/utils/performance-monitor';

const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  const requestCache = useRef(new Map<string, { data: T; timestamp: number }>());
  const retryCount = useRef(0);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const clearStaleCache = useCallback(() => {
    const now = Date.now();
    Array.from(requestCache.current.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        requestCache.current.delete(key);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(clearStaleCache, CACHE_TTL);
    return () => {
      clearInterval(interval);
      requestCache.current.clear();
    };
  }, [clearStaleCache]);

  const retryWithDelay = useCallback(async (error: Error): Promise<T> => {
    if (retryCount.current >= MAX_RETRIES) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount.current)));
    retryCount.current++;
    return queryFn();
  }, [queryFn]);
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
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    keepPreviousData: true,
    ...options,
    select: (data) => {
      if (options?.select) {
        return options.select(data);
      }
      return data;
    },
  });
}