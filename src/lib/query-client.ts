import { QueryClient } from '@tanstack/react-query';

// Create optimized query client with efficient caching strategy
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Performance optimizations
      structuralSharing: true,
      
      // Error handling
      useErrorBoundary: true,
    },
    mutations: {
      // Retry failed mutations (e.g. network issues)
      retry: 1,
      useErrorBoundary: true,
    },
  },
});

// Cache warmer for critical data
export async function warmCache() {
  // Prefetch key data on app startup
  await Promise.all([
    queryClient.prefetchQuery(['activeAgreements'], () => 
      supabaseClient.from('leases').select('id').eq('status', 'active').limit(0)),
    
    queryClient.prefetchQuery(['availableVehicles'], () => 
      supabaseClient.from('vehicles').select('id').eq('availability_status', 'available').limit(0))
  ]);
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate related queries after updating an agreement
  afterAgreementUpdate: (agreementId) => {
    queryClient.invalidateQueries(['agreements']);
    queryClient.invalidateQueries(['agreement', agreementId]);
    queryClient.invalidateQueries(['dashboardStats']);
  },
  
  // Invalidate related queries after payment recording
  afterPaymentRecorded: (agreementId) => {
    queryClient.invalidateQueries(['payments', agreementId]);
    queryClient.invalidateQueries(['agreement', agreementId]);
    queryClient.invalidateQueries(['dashboardStats']);
  },
  
  // Invalidate vehicle availability after status change
  afterVehicleStatusChange: () => {
    queryClient.invalidateQueries(['vehicles']);
    queryClient.invalidateQueries(['availableVehicles']);
  }
};
