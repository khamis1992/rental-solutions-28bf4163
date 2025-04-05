
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCacheManager } from '@/hooks/use-cache-manager';
import { supabase } from '@/lib/supabase';

/**
 * Hook that prefetches data for common navigation paths
 * This is used to improve perceived performance by loading data
 * before the user navigates to a page
 */
export function usePrefetch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prefetchEntity } = useCacheManager();
  
  useEffect(() => {
    // Only run prefetching in production to avoid unnecessary requests in development
    if (process.env.NODE_ENV === 'development') return;
    
    // Track which links are currently visible in the viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          
          // Get the path from the href
          const href = link.getAttribute('href');
          if (!href || href.startsWith('http') || href === '#') return;
          
          // Extract entity type and ID from common URL patterns
          const vehicleMatch = href.match(/\/vehicles\/([^\/]+)$/);
          const customerMatch = href.match(/\/customers\/([^\/]+)$/);
          const agreementMatch = href.match(/\/agreements\/([^\/]+)$/);
          
          try {
            // Prefetch based on entity type
            if (vehicleMatch && vehicleMatch[1]) {
              prefetchEntity('vehicles', vehicleMatch[1]);
            } else if (customerMatch && customerMatch[1]) {
              prefetchEntity('customers', customerMatch[1]);
            } else if (agreementMatch && agreementMatch[1]) {
              prefetchEntity('agreements', agreementMatch[1]);
            }
          } catch (error) {
            // Silently handle prefetch errors - they shouldn't impact the user experience
            console.warn('Error prefetching data:', error);
          }
        }
      });
    }, { threshold: 0.1 }); // Start observing when 10% of the element is visible
    
    // Find all anchor links in the page
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      observer.observe(link);
    });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [location.pathname, prefetchEntity]);
  
  // Also prefetch data related to the current page
  useEffect(() => {
    // Potential prefetch on page load for common detail pages
    const vehicleMatch = location.pathname.match(/\/vehicles\/([^\/]+)$/);
    const customerMatch = location.pathname.match(/\/customers\/([^\/]+)$/);
    const agreementMatch = location.pathname.match(/\/agreements\/([^\/]+)$/);
    
    if (agreementMatch && agreementMatch[1]) {
      // When viewing an agreement, prefetch related vehicle and customer data
      const loadRelatedData = async () => {
        try {
          const { data } = await supabase
            .from('leases')
            .select('vehicle_id, customer_id')
            .eq('id', agreementMatch[1])
            .single();
            
          if (data && data.vehicle_id) {
            prefetchEntity('vehicles', data.vehicle_id);
          }
          
          if (data && data.customer_id) {
            prefetchEntity('customers', data.customer_id);
          }
        } catch (error) {
          // Silently handle errors for prefetching
          console.warn('Error prefetching related data:', error);
        }
      };
      
      loadRelatedData();
    }
  }, [location.pathname, prefetchEntity]);
  
  return null;
}
