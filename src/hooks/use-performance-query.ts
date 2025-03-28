
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { startMeasure } from '@/utils/performance-monitoring';

/**
 * A wrapper around useQuery that adds performance monitoring
 * This hook automatically measures the duration of API requests
 */
export function usePerformanceQuery<TData, TError>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  // Create a wrapped query function that measures performance
  const measuredQueryFn = () => {
    const endMeasure = startMeasure(`api:${queryKey.join('.')}`, { queryKey });
    
    return queryFn().then(result => {
      endMeasure();
      return result;
    }).catch(error => {
      endMeasure();
      throw error;
    });
  };

  // Use the standard useQuery with our measured query function
  return useQuery({
    queryKey,
    queryFn: measuredQueryFn,
    ...options
  });
}
