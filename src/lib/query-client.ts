import { QueryClient } from '@tanstack/react-query';

// Constants for caching and stale time
export const CACHE_TIME = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const BACKGROUND_STALE_TIME = 1000 * 60 * 2; // 2 minutes

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
      suspense: true,
      useErrorBoundary: true,
      refetchInterval: false,
    },
    mutations: {
      useErrorBoundary: true,
      retry: 1,
    },
  },
  queryCache: new QueryClient().getQueryCache(),
});

// Pre-configured query keys
export const queryKeys = {
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.vehicles.lists(), filters] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
  },
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  agreements: {
    all: ['agreements'] as const,
    lists: () => [...queryKeys.agreements.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.agreements.lists(), filters] as const,
    details: () => [...queryKeys.agreements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agreements.details(), id] as const,
  },
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.maintenance.lists(), filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentActivity: ['dashboard', 'activity'] as const,
    charts: ['dashboard', 'charts'] as const,
  },
  settings: {
    user: ['settings', 'user'] as const,
    system: ['settings', 'system'] as const,
  },
  trafficFines: {
    all: ['traffic-fines'] as const,
    lists: () => [...queryKeys.trafficFines.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.trafficFines.lists(), filters] as const,
  }
};