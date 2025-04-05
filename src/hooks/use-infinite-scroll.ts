
import { useEffect, useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseInfiniteScrollOptions {
  fetchMore: () => Promise<any>;
  isLoading: boolean;
  hasMore: boolean;
  threshold?: number;
  enabled?: boolean;
}

export function useInfiniteScroll({
  fetchMore,
  isLoading,
  hasMore,
  threshold = 100,
  enabled = true
}: UseInfiniteScrollOptions) {
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  
  // Only enable infinite scroll on mobile if specified
  const isEnabled = enabled && (isMobile || !enabled);
  
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      
      // If the element is in view and we're not already loading and there's more to load
      if (target.isIntersecting && !isLoading && !isFetchingMore && hasMore && isEnabled) {
        setIsFetchingMore(true);
        fetchMore().finally(() => {
          setIsFetchingMore(false);
        });
      }
    },
    [fetchMore, isLoading, isFetchingMore, hasMore, isEnabled]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !isEnabled) return;
    
    // Disconnect previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer
    const options = {
      root: null, // Use viewport as root
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0.1,
    };
    
    observerRef.current = new IntersectionObserver(handleObserver, options);
    observerRef.current.observe(element);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold, isEnabled]);

  return {
    loadMoreRef,
    isFetchingMore,
  };
}
