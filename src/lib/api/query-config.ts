
import { UseQueryOptions } from '@tanstack/react-query';

type QueryMeta = Record<string, unknown>;

/**
 * Create a standard query configuration with consistent defaults
 */
export function createQueryConfig<TData, TKey extends unknown[]>(
  queryKey: TKey,
  options?: Partial<UseQueryOptions<TData, Error, TData, TKey>>
): UseQueryOptions<TData, Error, TData, TKey> {
  return {
    queryKey,
    retry: (failureCount, error) => {
      // Only retry network errors or 5XX server errors
      if (error instanceof Error && error.message.includes('Network Error')) {
        return failureCount < 3;
      }
      return false;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  };
}

/**
 * Create a query configuration with additional metadata
 */
export function createMetaQueryConfig<TData, TKey extends unknown[]>(
  queryKey: TKey,
  meta: QueryMeta,
  options?: Partial<UseQueryOptions<TData, Error, TData, TKey>>
): UseQueryOptions<TData, Error, TData, TKey> {
  return createQueryConfig(queryKey, {
    ...options,
    meta
  });
}
