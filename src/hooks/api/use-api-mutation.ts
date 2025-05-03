
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { handleApiError, handleApiSuccess } from '@/lib/api/error-api';

/**
 * Standardized hook for API mutations with consistent error handling
 *
 * @param mutationFn - The function that performs the mutation
 * @param options - Additional options for the mutation
 * @returns UseMutationResult with data or error
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    successMessage?: string;
    errorContext?: string;
    invalidateQueries?: string[][];
  }
): UseMutationResult<TData, Error, TVariables, unknown> {
  const { errorContext, invalidateQueries, ...mutationOptions } = options || {};

  return useMutation({
    mutationFn: async (variables) => {
      try {
        const result = await mutationFn(variables);

        // Check for Supabase-style responses
        if (result && typeof result === 'object' && 'error' in result) {
          const supabaseResponse = result as unknown as { error: any; data: TData };
          if (supabaseResponse.error) {
            throw supabaseResponse.error;
          }
        }

        if (options?.successMessage) {
          handleApiSuccess(options.successMessage);
        }

        return result;
      } catch (error) {
        handleApiError(error, errorContext || 'Error during mutation');
        throw error;
      }
    },
    onSuccess: mutationOptions.onSuccess,
    onError: mutationOptions.onError,
    onSettled: mutationOptions.onSettled
  });
}
