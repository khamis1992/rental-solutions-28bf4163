
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Hook to prefetch data based on links present in the current page
 * This helps improve perceived performance by preloading data
 * before the user navigates to a new page
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigationType = useNavigationType();

  // Prefetch vehicle details when on the vehicles list page
  useEffect(() => {
    if (location.pathname === '/vehicles' && navigationType !== 'POP') {
      const prefetchVehicleDetails = async () => {
        const vehicleLinks = document.querySelectorAll('a[href^="/vehicles/"]');
        
        // Extract vehicle IDs from links
        const vehicleIds = Array.from(vehicleLinks)
          .map(link => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/vehicles\/(.+)/);
            return match ? match[1] : null;
          })
          .filter(id => id !== null) as string[];
        
        // Only prefetch the first few to avoid excessive requests
        const idsToFetch = [...new Set(vehicleIds)].slice(0, 5);
        
        if (idsToFetch.length > 0) {
          // Import the fetch function dynamically to avoid circular dependencies
          const { fetchVehicleById } = await import('@/lib/vehicles/vehicle-api');
          
          // Prefetch each vehicle
          idsToFetch.forEach(id => {
            queryClient.prefetchQuery({
              queryKey: ['vehicles', id],
              queryFn: () => fetchVehicleById(id),
              staleTime: 2 * 60 * 1000, // 2 minutes
            });
          });
        }
      };
      
      // Use requestIdleCallback if available, otherwise use setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prefetchVehicleDetails, { timeout: 2000 });
      } else {
        setTimeout(prefetchVehicleDetails, 1000);
      }
    }
  }, [location.pathname, navigationType, queryClient]);
  
  return null;
}
