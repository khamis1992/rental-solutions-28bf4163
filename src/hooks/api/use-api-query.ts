
import { useQuery } from '@tanstack/react-query';

// Define generic types for the hook
interface ApiResponse<T> {
  data: T | null;
  error: any | null;
}

export function useApiQuery<TData = any, TError = any>(
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: any
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        
        // Handle response format correctly
        if (response && 'error' in response && response.error) {
          // Convert to expected error format
          const errorResult = {
            error: response.error,
            data: null
          } as ApiResponse<TData>;
          return Promise.reject(errorResult);
        }
        
        // Make sure we return the data in the expected format
        return response?.data || null;
      } catch (error) {
        console.error(`API query error for ${queryKey.join('/')}:`, error);
        // Convert error to expected format before rejecting
        const errorResult = { 
          error: error instanceof Error ? error : new Error(String(error)),
          data: null
        } as ApiResponse<TData>;
        return Promise.reject(errorResult);
      }
    },
    ...options
  });
}
