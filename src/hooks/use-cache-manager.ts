
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for managing cache operations with TanStack Query
 */
export function useCacheManager() {
  const queryClient = useQueryClient();

  /**
   * Invalidate specific queries by prefix
   */
  const invalidateByPrefix = (prefix: string) => {
    queryClient.invalidateQueries({ queryKey: [prefix] });
  };

  /**
   * Invalidate related queries by entity
   * @param entityType The type of entity (e.g., 'vehicles', 'customers')
   * @param id The ID of the entity
   * @param invalidateList Optional array of related entities to invalidate
   */
  const invalidateEntity = (entityType: string, id: string, invalidateList: string[] = []) => {
    // Invalidate the specific entity
    queryClient.invalidateQueries({ queryKey: [entityType, id] });
    
    // Invalidate the collection
    queryClient.invalidateQueries({ queryKey: [entityType], exact: false });
    
    // Invalidate related entities if specified
    if (invalidateList.length > 0) {
      invalidateList.forEach(entity => {
        queryClient.invalidateQueries({ queryKey: [entity], exact: false });
      });
    }
  };

  /**
   * Prefetch data for common navigation paths
   * @param entityType The type of entity to prefetch
   * @param id The ID of the entity to prefetch
   */
  const prefetchEntity = async (entityType: string, id: string) => {
    // We need to determine which fetch function to use based on entity type
    let fetchFn;
    
    switch (entityType) {
      case 'vehicles':
        const { fetchVehicleById } = await import('@/lib/vehicles/vehicle-api');
        fetchFn = () => fetchVehicleById(id);
        break;
      default:
        return; // No fetcher available for this entity type
    }
    
    // Prefetch the data with a longer stale time
    return queryClient.prefetchQuery({
      queryKey: [entityType, id],
      queryFn: fetchFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  /**
   * Update an entity in the cache without refetching
   */
  const updateCache = <T,>(queryKey: unknown[], updater: (oldData: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, (oldData: T | undefined) => updater(oldData));
  };

  return {
    invalidateByPrefix,
    invalidateEntity,
    prefetchEntity,
    updateCache,
    queryClient
  };
}
