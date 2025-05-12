
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { handleApiError, handleApiSuccess } from '@/lib/api/enhanced-error-handlers';

/**
 * Options for creating a mutation
 */
interface MutationFactoryOptions<TData, TVariables> {
  /** Message to show on successful mutation */
  successMessage?: string;
  /** Custom success handler */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Custom error handler */
  onError?: (error: Error, variables: TVariables) => void;
  /** Handler for both success and error cases */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  /** Query keys to invalidate after successful mutation */
  invalidateQueries?: string[][];
  /** Context for error messages */
  errorContext?: string;
}

/**
 * Factory function to create mutations with consistent behavior for success/error handling
 * @param mutationFn The function that performs the mutation
 * @param options Configuration options
 */
export function createMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationFactoryOptions<TData, TVariables>
): UseMutationResult<TData, Error, TVariables, unknown> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables) => {
      try {
        const result = await mutationFn(variables);
        
        if (options?.successMessage) {
          handleApiSuccess(options.successMessage);
        }
        
        return result;
      } catch (error) {
        handleApiError(error, options?.errorContext);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries if specified
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom success handler if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: options?.onError,
    onSettled: options?.onSettled
  });
}

/**
 * Creates a mutation with optimistic updates
 * @param mutationFn The function that performs the mutation
 * @param options Configuration options with optimistic update handlers
 */
export function createOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationFactoryOptions<TData, TVariables> & {
    /** Function to generate optimistic data */
    getOptimisticData: (variables: TVariables) => TData;
    /** Query key to update optimistically */
    queryKey: string[];
  }
): UseMutationResult<TData, Error, TVariables, { previousData: unknown }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(options.queryKey);
      
      // Optimistically update to the new value
      queryClient.setQueryData(options.queryKey, options.getOptimisticData(variables));
      
      // Return a context object with the previous data
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
      
      // Show error toast
      handleApiError(err, options?.errorContext);
      
      // Call custom error handler if provided
      if (options?.onError) {
        options.onError(err, variables);
      }
    },
    onSuccess: (data, variables) => {
      // Show success message if provided
      if (options?.successMessage) {
        handleApiSuccess(options.successMessage);
      }
      
      // Invalidate relevant queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom success handler if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onSettled: options?.onSettled
  });
}
