
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

// Standardized error handling for API calls
export const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  // Extract error message
  let errorMessage = 'An unknown error occurred';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }
  
  // Display toast notification
  toast.error('Operation failed', {
    description: errorMessage,
  });
  
  return errorMessage;
};

// Type for API functions
type ApiFunction<TParams, TResponse> = (params: TParams) => Promise<TResponse>;

// Standard hook for data fetching
export function useApiQuery<TData, TError = unknown>(
  queryKey: string[], 
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

// Standard hook for data mutations
export function useApiMutation<TData, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onError: (error, variables, context) => {
      handleApiError(error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

// Helper hook for CRUD operations
export function useCrudApi<TItem extends { id: string }>(resourceName: string) {
  const queryClient = useQueryClient();
  const queryKey = [resourceName];
  
  const invalidateResource = () => {
    return queryClient.invalidateQueries({ queryKey });
  };
  
  return {
    // Get list of resources
    useList: <TFilter = void>(filter?: TFilter) => {
      const query = useApiQuery(
        filter ? [...queryKey, 'list', JSON.stringify(filter)] : [...queryKey, 'list'], 
        async () => {
          // Replace with actual API call
          return [] as TItem[];
        },
        {
          // Handle errors through the query state instead of callbacks
          meta: {
            errorHandler: (error: unknown) => handleApiError(error)
          }
        }
      );
      
      // Handle errors manually when the query fails
      if (query.error) {
        handleApiError(query.error);
      }
      
      return query;
    },
      
    // Get single resource
    useItem: (id: string) => {
      const query = useApiQuery(
        [...queryKey, id], 
        async () => {
          // Replace with actual API call
          return {} as TItem;
        },
        {
          // Handle errors through the query state instead of callbacks
          meta: {
            errorHandler: (error: unknown) => handleApiError(error)
          }
        }
      );
      
      // Handle errors manually when the query fails
      if (query.error) {
        handleApiError(query.error);
      }
      
      return query;
    },
      
    // Create resource
    useCreate: () => 
      useApiMutation(
        async (data: Omit<TItem, 'id'>) => {
          // Replace with actual API call
          return {} as TItem;
        },
        {
          onSuccess: () => {
            toast.success(`${resourceName} created successfully`);
            invalidateResource();
          }
        }
      ),
      
    // Update resource
    useUpdate: () => 
      useApiMutation(
        async ({ id, data }: { id: string, data: Partial<TItem> }) => {
          // Replace with actual API call
          return {} as TItem;
        },
        {
          onSuccess: () => {
            toast.success(`${resourceName} updated successfully`);
            invalidateResource();
          }
        }
      ),
      
    // Delete resource
    useDelete: () => 
      useApiMutation(
        async (id: string) => {
          // Replace with actual API call
          return id;
        },
        {
          onSuccess: () => {
            toast.success(`${resourceName} deleted successfully`);
            invalidateResource();
          }
        }
      ),
  };
}
