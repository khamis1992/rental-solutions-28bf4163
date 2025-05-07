
import { useQuery, useMutation, MutationFunction, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

export function useSupabaseQuery<TData = unknown, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...options
  });
}

export function useSupabaseMutation<TData = unknown, TVariables = void, TContext = unknown, TError = Error>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options
  });
}
