import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { ResourcePriority, preloadRoute } from '../utils/resource-queue';

type RouteConfig = {
  path: string;
  priority?: ResourcePriority;
};

/**
 * Hook to prefetch routes as user interaction suggests they might navigate to them
 * @param routes Array of route paths to prefetch
 * @param shouldPrefetch Boolean to control if prefetching should happen
 */
export function useRoutePrefetch(
  routes: RouteConfig[] | string[],
  shouldPrefetch: boolean = true
): void {
  useEffect(() => {
    if (!shouldPrefetch || !routes.length) return;
    
    // Normalize routes to uniform format
    const normalizedRoutes: RouteConfig[] = routes.map(route => 
      typeof route === 'string' ? { path: route, priority: ResourcePriority.MEDIUM } : route
    );
    
    // Start prefetching in sequence, prioritized by the specified priority
    normalizedRoutes
      .sort((a, b) => (a.priority || ResourcePriority.MEDIUM) - (b.priority || ResourcePriority.MEDIUM))
      .forEach(({ path, priority = ResourcePriority.MEDIUM }) => {
        preloadRoute(path, priority).catch(error => {
          console.warn(`Failed to prefetch route: ${path}`, error);
        });
      });
  }, [routes, shouldPrefetch]);
}

/**
 * Hook to prefetch routes when user hovers or focuses on navigation elements
 * @param routeConfig Route configuration including path and priority
 * @returns Object with handlers to attach to navigation elements
 */
export function usePrefetchOnHover(routeConfig: RouteConfig | string): {
  handleMouseEnter: () => void;
  handleFocus: () => void;
} {
  const normalizedRoute: RouteConfig = 
    typeof routeConfig === 'string' ? { path: routeConfig, priority: ResourcePriority.HIGH } : routeConfig;
    
  const prefetchRoute = () => {
    preloadRoute(normalizedRoute.path, normalizedRoute.priority || ResourcePriority.HIGH).catch(error => {
      console.warn(`Failed to prefetch route on hover: ${normalizedRoute.path}`, error);
    });
  };

  return {
    handleMouseEnter: prefetchRoute,
    handleFocus: prefetchRoute
  };
}

/**
 * Prefetches critical routes for your application on initial load
 * @param criticalRoutes Array of critical route paths to prefetch immediately
 */
export function prefetchCriticalRoutes(criticalRoutes: RouteConfig[] | string[]): void {
  // Normalize routes to uniform format
  const normalizedRoutes: RouteConfig[] = criticalRoutes.map(route => 
    typeof route === 'string' ? { path: route, priority: ResourcePriority.CRITICAL } : {
      ...route,
      priority: route.priority || ResourcePriority.CRITICAL
    }
  );
  
  // Prefetch in order of priority
  normalizedRoutes
    .sort((a, b) => (a.priority || ResourcePriority.CRITICAL) - (b.priority || ResourcePriority.CRITICAL))
    .forEach(({ path, priority = ResourcePriority.CRITICAL }) => {
      preloadRoute(path, priority).catch(error => {
        console.warn(`Failed to prefetch critical route: ${path}`, error);
      });
    });
}

export const usePrefetchRouteData = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    const prefetchData = async () => {
      const path = location.pathname;

      // Dashboard prefetching
      if (path.startsWith('/dashboard')) {
        await Promise.all([
          queryClient.prefetchQuery(queryKeys.dashboard.stats),
          queryClient.prefetchQuery(queryKeys.dashboard.recentActivity),
          queryClient.prefetchQuery(queryKeys.dashboard.charts),
        ]);
      }

      // Vehicles list prefetching
      if (path.startsWith('/vehicles')) {
        await queryClient.prefetchQuery(queryKeys.vehicles.lists());
      }

      // Customers list prefetching
      if (path.startsWith('/customers')) {
        await queryClient.prefetchQuery(queryKeys.customers.lists());
      }

      // Agreements list prefetching
      if (path.startsWith('/agreements')) {
        await queryClient.prefetchQuery(queryKeys.agreements.lists());
      }

      // Maintenance list prefetching
      if (path.startsWith('/maintenance')) {
        await queryClient.prefetchQuery(queryKeys.maintenance.lists());
      }

      // Individual item prefetching
      const matches = path.match(/\/(vehicles|customers|agreements|maintenance)\/([^/]+)$/);
      if (matches) {
        const [, type, id] = matches;
        switch (type) {
          case 'vehicles':
            await queryClient.prefetchQuery(queryKeys.vehicles.detail(id));
            break;
          case 'customers':
            await queryClient.prefetchQuery(queryKeys.customers.detail(id));
            break;
          case 'agreements':
            await queryClient.prefetchQuery(queryKeys.agreements.detail(id));
            break;
          case 'maintenance':
            await queryClient.prefetchQuery(queryKeys.maintenance.detail(id));
            break;
        }
      }
    };

    prefetchData();
  }, [location.pathname, queryClient]);
};