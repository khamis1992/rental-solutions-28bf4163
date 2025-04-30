import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

export const useCrudApi = (tableName: string) => {
  const queryKey = [tableName];
  
  const getAll = () => useApiQuery(
    queryKey,
    async () => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return data;
    }
  );

  const create = useApiMutation(
    async (payload: any) => {
      const { data, error } = await supabase.from(tableName).insert(payload).select();
      if (error) throw error;
      return data;
    }
  );

  return { getAll, create };
};
