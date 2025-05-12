
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/lib/api/enhanced-error-handlers';

// Define generic types for the hook
interface ApiResponse<T> {
  data: T | null;
  error: any | null;
}

export function useApiQuery<TData = any, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: boolean | number;
    retryDelay?: number;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    errorContext?: string;
    [key: string]: any;
  }
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
        
        // Use our enhanced error handler
        handleApiError(error, options?.errorContext || `Query ${queryKey.join('/')}`);
        
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
