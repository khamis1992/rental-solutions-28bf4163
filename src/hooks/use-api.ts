import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function handleApiError(error: unknown, context = 'API request') {
  console.error(`${context} failed:`, error);
  toast.error(`${context} failed`, {
    description: error instanceof Error ? error.message : 'Unknown error occurred'
  });
  return error;
}

export const useApiQuery = <TData = any, TError = Error>(
  queryKey: string | string[],
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) => {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options
  });
};

export const useApiMutation = <TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables, TContext>
) => {
  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    ...options
  });
};

export const useCrudApi = <TData = any>(tableName: string) => {
  const queryKey = [tableName];
  
  const getAll = () => useApiQuery<TData[]>(queryKey, async () => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    return data as TData[];
  });

  const create = useApiMutation<TData, any>(async (payload) => {
    const { data, error } = await supabase.from(tableName).insert(payload).select();
    if (error) throw error;
    return data[0] as TData;
  });

  return { getAll, create };
};
