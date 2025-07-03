import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface LazyLoadingResult {
  isVisible: boolean;
  hasBeenVisible: boolean;
  ref: React.RefObject<HTMLElement>;
}

// Hook للـ Intersection Observer based lazy loading
export const useAdvancedLazyLoading = (options: LazyLoadingOptions = {}): LazyLoadingResult => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);

        if (isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }

        if (triggerOnce && hasBeenVisible) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

  return {
    isVisible,
    hasBeenVisible,
    ref
  };
};

// Hook لتتبع الأداء
export const usePerformanceMonitor = (componentName: string) => {
  const mountTimeRef = useRef<number>();
  const unmountCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Record mount time
    mountTimeRef.current = performance.now();
    
    // Mark performance start
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-mount-start`);
    }

    // Cleanup function
    return () => {
      if (mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        
        // Log slow mounts
        if (mountDuration > 100) {
          console.warn(`${componentName} took ${mountDuration.toFixed(2)}ms to mount`);
        }

        // Performance measurement
        if ('performance' in window && 'mark' in performance) {
          performance.mark(`${componentName}-mount-end`);
          performance.measure(
            `${componentName}-mount-duration`,
            `${componentName}-mount-start`,
            `${componentName}-mount-end`
          );
        }
      }

      // Execute cleanup if exists
      if (unmountCleanupRef.current) {
        unmountCleanupRef.current();
      }
    };
  }, [componentName]);

  // Method to add custom cleanup
  const addCleanup = useCallback((cleanup: () => void) => {
    unmountCleanupRef.current = cleanup;
  }, []);

  return { addCleanup };
};

// Hook لتحسين الذاكرة
export const useMemoryOptimization = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      });
    }
  }, []);

  const optimizeMemory = useCallback(() => {
    // Force garbage collection if available (development only)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Clear any expired cache entries
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && (now - item.timestamp) > maxAge) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });

    checkMemoryUsage();
  }, [checkMemoryUsage]);

  useEffect(() => {
    checkMemoryUsage();
    
    // Check memory usage every 30 seconds
    const interval = setInterval(checkMemoryUsage, 30000);
    
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return {
    memoryInfo,
    checkMemoryUsage,
    optimizeMemory
  };
};

// Hook لـ route preloading
export const useRoutePreloading = () => {
  const preloadedRoutes = useRef<Set<string>>(new Set());

  const preloadRoute = useCallback((routePath: string) => {
    if (preloadedRoutes.current.has(routePath)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = routePath;
    
    link.onload = () => {
      preloadedRoutes.current.add(routePath);
    };
    
    link.onerror = () => {
      console.warn(`Failed to preload route: ${routePath}`);
    };

    document.head.appendChild(link);
  }, []);

  const preloadRoutes = useCallback((routes: string[]) => {
    routes.forEach(route => preloadRoute(route));
  }, [preloadRoute]);

  return {
    preloadRoute,
    preloadRoutes,
    preloadedRoutes: Array.from(preloadedRoutes.current)
  };
};

// Hook لتتبع البيانات المحملة
export const useDataPreloading = () => {
  const [preloadedData, setPreloadedData] = useState<Map<string, any>>(new Map());
  const loadingPromises = useRef<Map<string, Promise<any>>>(new Map());

  const preloadData = useCallback(async <T>(
    key: string, 
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default TTL
  ): Promise<T> => {
    // Check if data is already preloaded and not expired
    const existing = preloadedData.get(key);
    if (existing && existing.timestamp && (Date.now() - existing.timestamp) < ttl) {
      return existing.data;
    }

    // Check if already loading
    const existingPromise = loadingPromises.current.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    const promise = fetcher().then(data => {
      const entry = {
        data,
        timestamp: Date.now()
      };
      
      setPreloadedData(prev => new Map(prev).set(key, entry));
      loadingPromises.current.delete(key);
      
      return data;
    }).catch(error => {
      loadingPromises.current.delete(key);
      throw error;
    });

    loadingPromises.current.set(key, promise);
    return promise;
  }, [preloadedData]);

  const getPreloadedData = useCallback((key: string) => {
    const entry = preloadedData.get(key);
    return entry?.data || null;
  }, [preloadedData]);

  const clearPreloadedData = useCallback((key?: string) => {
    if (key) {
      setPreloadedData(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    } else {
      setPreloadedData(new Map());
    }
  }, []);

  return {
    preloadData,
    getPreloadedData,
    clearPreloadedData,
    preloadedKeys: Array.from(preloadedData.keys())
  };
}; 