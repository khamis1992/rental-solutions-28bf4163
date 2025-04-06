
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
  const requestCache = useRef(new Map<string, Promise<T>>());
  const retryCount = useRef(0);
  
  useEffect(() => {
    return () => {
      requestCache.current.clear();
    };
  }, []);

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
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    ...options,
  });
}
