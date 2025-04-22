
import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Query key factory to ensure consistent keys across the application
export const queryKeys = {
  // Dashboard related queries
  dashboard: {
    stats: ['dashboard', 'stats'],
    charts: ['dashboard', 'charts'],
    recentActivity: ['dashboard', 'activity']
  },
  
  // Vehicle related queries
  vehicles: {
    lists: () => ['vehicles', 'list'],
    detail: (id: string) => ['vehicles', 'detail', id],
    status: (status: string) => ['vehicles', 'status', status],
  },
  
  // Customer related queries
  customers: {
    lists: () => ['customers', 'list'],
    detail: (id: string) => ['customers', 'detail', id],
    stats: ['customers', 'stats'],
  },
  
  // Agreement related queries
  agreements: {
    lists: () => ['agreements', 'list'],
    detail: (id: string) => ['agreements', 'detail', id],
    active: ['agreements', 'active'],
    pending: ['agreements', 'pending'],
  },
  
  // Maintenance related queries
  maintenance: {
    lists: () => ['maintenance', 'list'],
    detail: (id: string) => ['maintenance', 'detail', id],
    scheduled: ['maintenance', 'scheduled'],
    history: (vehicleId: string) => ['maintenance', 'history', vehicleId],
  },
  
  // Financial related queries
  financial: {
    summary: ['financial', 'summary'],
    transactions: (filters?: any) => ['financial', 'transactions', filters],
    expenses: (filters?: any) => ['financial', 'expenses', filters],
  },
  
  // Legal related queries
  legal: {
    cases: ['legal', 'cases'],
    caseDetail: (id: string) => ['legal', 'case', id],
    templates: ['legal', 'templates'],
  },
  
  // User related queries
  user: {
    profile: (id: string) => ['user', 'profile', id],
    preferences: (id: string) => ['user', 'preferences', id],
  },
};
