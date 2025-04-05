
import { useQueries } from '@tanstack/react-query';

interface BatchQueryOptions<T> {
  ids: string[];
  entityType: string;
  queryFn: (id: string) => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
}

/**
 * Hook to batch multiple queries for the same entity type
 * This is useful when you need to fetch multiple records at once
 */
export function useBatchQueries<T>({
  ids,
  entityType,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes by default
  select
}: BatchQueryOptions<T>) {
  return useQueries({
    queries: ids.map(id => ({
      queryKey: [entityType, id],
      queryFn: () => queryFn(id),
      enabled: enabled && !!id,
      staleTime,
      select,
    })),
  });
}

/**
 * Generate a batched query function for an entity type
 */
export function createBatchQueryFn<T>(
  entityType: string,
  singleEntityFn: (id: string) => Promise<T>
) {
  return async (ids: string[]): Promise<Record<string, T>> => {
    const results = await Promise.all(
      ids.map(async id => {
        try {
          const data = await singleEntityFn(id);
          return { id, data };
        } catch (error) {
          console.error(`Failed to fetch ${entityType} ${id}:`, error);
          return { id, error };
        }
      })
    );

    // Convert results to a map of id -> data
    return results.reduce((acc, { id, data, error }) => {
      if (!error) {
        acc[id] = data;
      }
      return acc;
    }, {} as Record<string, T>);
  };
}
