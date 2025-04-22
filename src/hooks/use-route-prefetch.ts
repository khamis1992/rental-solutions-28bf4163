
import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { queryClient, queryKeys } from '@/lib/query-client';

// Define routes that should prefetch data
const PREFETCH_ROUTES = {
  dashboard: {
    path: '/dashboard',
    prefetch: async () => {
      console.log('Prefetching dashboard data...');
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.stats,
          queryFn: () => fetch('/api/dashboard/stats').then(res => res.json())
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.recentActivity,
          queryFn: () => fetch('/api/dashboard/activity').then(res => res.json())
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.charts,
          queryFn: () => fetch('/api/dashboard/charts').then(res => res.json())
        })
      ]);
    }
  },
  vehicles: {
    path: '/vehicles',
    prefetch: async () => {
      console.log('Prefetching vehicles data...');
      await queryClient.prefetchQuery({
        queryKey: queryKeys.vehicles.lists(),
        queryFn: () => fetch('/api/vehicles').then(res => res.json())
      });
    }
  },
  customers: {
    path: '/customers',
    prefetch: async () => {
      console.log('Prefetching customers data...');
      await queryClient.prefetchQuery({
        queryKey: queryKeys.customers.lists(),
        queryFn: () => fetch('/api/customers').then(res => res.json())
      });
    }
  },
  agreements: {
    path: '/agreements',
    prefetch: async () => {
      console.log('Prefetching agreements data...');
      await queryClient.prefetchQuery({
        queryKey: queryKeys.agreements.lists(),
        queryFn: () => fetch('/api/agreements').then(res => res.json())
      });
    }
  },
  maintenance: {
    path: '/maintenance',
    prefetch: async () => {
      console.log('Prefetching maintenance data...');
      await queryClient.prefetchQuery({
        queryKey: queryKeys.maintenance.lists(),
        queryFn: () => fetch('/api/maintenance').then(res => res.json())
      });
    }
  },
};

// Route-specific prefetching
const prefetchRouteData = async (route: string) => {
  const routeKey = Object.keys(PREFETCH_ROUTES).find(
    key => PREFETCH_ROUTES[key as keyof typeof PREFETCH_ROUTES].path === route
  );

  if (routeKey) {
    try {
      await PREFETCH_ROUTES[routeKey as keyof typeof PREFETCH_ROUTES].prefetch();
    } catch (error) {
      console.error(`Error prefetching data for route ${route}:`, error);
    }
  }
};

// For prefetching data for route parameters (detail views)
const prefetchDetailData = async (route: string, id: string) => {
  if (route.startsWith('/vehicles/') && id) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.vehicles.detail(id),
      queryFn: () => fetch(`/api/vehicles/${id}`).then(res => res.json())
    });
  } else if (route.startsWith('/customers/') && id) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.customers.detail(id),
      queryFn: () => fetch(`/api/customers/${id}`).then(res => res.json())
    });
  } else if (route.startsWith('/agreements/') && id) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.agreements.detail(id),
      queryFn: () => fetch(`/api/agreements/${id}`).then(res => res.json())
    });
  }
};

export function usePrefetchRouteData() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initial prefetch for current route
  useEffect(() => {
    const currentPath = location.pathname;
    const mainRoute = `/${currentPath.split('/')[1]}`;
    prefetchRouteData(mainRoute);
  }, [location.pathname]);

  // Hook for navigation event to prefetch data
  useEffect(() => {
    const originalNavigate = navigate;
    
    // Override navigate to prefetch data before navigation
    const enhancedNavigate = (to: string, options?: any) => {
      const mainRoute = to.startsWith('/') ? `/${to.split('/')[1]}` : `/${to}`;
      prefetchRouteData(mainRoute);
      return originalNavigate(to, options);
    };
    
    // @ts-ignore - we're monkey-patching the navigate function
    navigate = enhancedNavigate;
    
    return () => {
      // @ts-ignore - restore original navigate
      navigate = originalNavigate;
    };
  }, [navigate]);
  
  return {
    prefetchRoute: prefetchRouteData,
    prefetchDetail: prefetchDetailData
  };
}
