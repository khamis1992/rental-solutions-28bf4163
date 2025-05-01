
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { handleApiError, handleApiSuccess } from '@/lib/api/error-api';

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    successMessage?: string;
    errorContext?: string; // Added context parameter
  }
): UseMutationResult<TData, Error, TVariables, unknown> {
  const { errorContext, ...mutationOptions } = options || {};
  
  return useMutation({
    mutationFn: async (variables) => {
      try {
        const result = await mutationFn(variables);
        if (options?.successMessage) {
          handleApiSuccess(options.successMessage);
        }
        return result;
      } catch (error) {
        handleApiError(error, errorContext);
        throw error;
      }
    },
    onSuccess: mutationOptions.onSuccess,
    onError: mutationOptions.onError,
    onSettled: mutationOptions.onSettled
  });
}
