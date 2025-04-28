
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { handleApiError, handleApiSuccess } from '@/lib/api/error-handlers';

/**
 * Custom hook for API mutations with standardized error handling
 *
 * @param mutationFn - The function that performs the mutation
 * @param options - Additional React Query mutation options
 * @returns The result from useMutation with proper error handling
 */
export function useApiMutation<TData, TVariables, TError = Error, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const result = await mutationFn(variables);
        
        // If onSuccess callback is provided in options, don't show success message here
        // as the component will handle it
        if (!options?.onSuccess && typeof options?.meta?.successMessage === 'string') {
          handleApiSuccess(options.meta.successMessage);
        }
        
        return result;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    ...options
  });
}
