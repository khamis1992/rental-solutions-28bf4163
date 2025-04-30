import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useError } from '@/contexts/ErrorContext';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/types/api-response';

export function handleApiError(error: unknown, context = 'API request') {
  console.error(`${context} failed:`, error);
  toast.error(`${context} failed`, {
    description: error instanceof Error ? error.message : 'Unknown error occurred'
  });
  return error;
}

export const useApiQuery = <TData = any, TError = Error>(
  queryKey: string | string[],
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: UseQueryOptions<ApiResponse<TData>, TError>
) => {
  const { handleError } = useError();

  return useQuery<ApiResponse<TData>, TError>({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        if (!response.success) {
          handleError(response.error, response.message);
        }
        return response;
      } catch (error) {
        const errorResponse = createErrorResponse(error, 'API Query Failed');
        handleError(errorResponse.error, errorResponse.message);
        return errorResponse;
      }
    },
    ...options
  });
};

export const useApiMutation = <TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables, TContext>
) => {
  const { handleError } = useError();

  return useMutation<ApiResponse<TData>, Error, TVariables, TContext>({
    mutationFn: async (variables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          handleError(response.error, response.message);
        }
        return response;
      } catch (error) {
        const errorResponse = createErrorResponse(error, 'API Mutation Failed');
        handleError(errorResponse.error, errorResponse.message);
        return errorResponse;
      }
    },
    ...options
  });
};

export const useCrudApi = <TData = any>(tableName: string) => {
  const queryKey = [tableName];
  
  const getAll = () => useApiQuery<TData[]>(queryKey, async () => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      return createErrorResponse(error, 'Failed to fetch data');
    }
    return createSuccessResponse(data as TData[]);
  });

  const create = useApiMutation<TData, any>(async (payload) => {
    const { data, error } = await supabase.from(tableName).insert(payload).select();
    if (error) {
      return createErrorResponse(error, 'Failed to create data');
    }
    return createSuccessResponse(data[0] as TData);
  });

  return { getAll, create };
};
