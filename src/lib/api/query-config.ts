
/**
 * Creates a standardized query configuration object for React Query
 * @param options - Custom query options
 * @returns React Query configuration
 */
export function createQueryConfig(options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: boolean | number;
}) {
  return {
    // Default to enabled
    enabled: options?.enabled !== false,
    
    // Default to refetching on mount for fresh data
    refetchOnMount: options?.refetchOnMount !== false,
    
    // Default to not refetching on window focus for better performance
    refetchOnWindowFocus: options?.refetchOnWindowFocus || false,
    
    // Default to refetching when reconnecting
    refetchOnReconnect: options?.refetchOnReconnect !== false,
    
    // Default to 1 retry
    retry: options?.retry === undefined ? 1 : options.retry,
    
    // Default staleTime (5 minutes)
    staleTime: 5 * 60 * 1000
  };
}
