/**
 * أدوات شاملة لمراقبة وتحسين الأداء
 * Performance monitoring and optimization utilities
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, LazyExoticComponent, ComponentType } from 'react';

// Performance timing interface
interface PerformanceTiming {
  name: string;
  start: number;
  end?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  rerenderCount: number;
  memoryUsage?: number;
  timestamp: number;
}

// Performance monitor class
class PerformanceMonitor {
  private timings: Map<string, PerformanceTiming> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  // Start timing a operation
  startTiming(name: string, metadata?: Record<string, any>): void {
    this.timings.set(name, {
      name,
      start: performance.now(),
      metadata
    });
  }

  // End timing and calculate duration
  endTiming(name: string): number | null {
    const timing = this.timings.get(name);
    if (!timing) return null;

    const end = performance.now();
    const duration = end - timing.start;
    
    timing.end = end;
    timing.duration = duration;

    console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`, timing.metadata);
    
    return duration;
  }

  // Record performance metrics
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    this.observers.forEach(observer => observer(metrics));
    
    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  // Subscribe to performance metrics
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Get performance summary
  getSummary(): {
    averageRenderTime: number;
    totalRerenders: number;
    slowestOperations: PerformanceTiming[];
  } {
    const completedTimings = Array.from(this.timings.values())
      .filter(t => t.duration !== undefined);
    
    const averageRenderTime = this.metrics.length > 0
      ? this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length
      : 0;
    
    const totalRerenders = this.metrics.reduce((sum, m) => sum + m.rerenderCount, 0);
    
    const slowestOperations = completedTimings
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      averageRenderTime,
      totalRerenders,
      slowestOperations
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance-optimized component wrapper
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  const WrappedComponent = React.memo((props: T) => {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());

    useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      renderCount.current += 1;

      performanceMonitor.recordMetrics({
        renderTime,
        componentCount: 1,
        rerenderCount: renderCount.current,
        timestamp: Date.now()
      });

      if (renderTime > 16) { // > 16ms might cause frame drops
        console.warn(`🚨 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    });

    // Reset start time for next render
    startTime.current = performance.now();

    return React.createElement(Component, props);
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    renderCount.current += 1;
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const newMetrics: PerformanceMetrics = {
        renderTime,
        componentCount: 1,
        rerenderCount: renderCount.current,
        timestamp: Date.now()
      };
      
      setMetrics(newMetrics);
      performanceMonitor.recordMetrics(newMetrics);
    };
  });

  return { metrics, renderCount: renderCount.current };
}

// Hook for debounced values to reduce re-renders
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled functions
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        func(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [func, delay]
  );
}

// Hook for memoized expensive calculations
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    const start = performance.now();
    const result = factory();
    const duration = performance.now() - start;
    
    if (duration > 5) { // Log calculations that take more than 5ms
      console.log(`🧮 Expensive calculation: ${debugName || 'unnamed'} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, deps);
}

// Hook for virtual scrolling (for large lists)
export function useVirtualScrolling({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
}

// Component render analyzer
export function analyzeComponentRenders() {
  const components = new Map<string, {
    renderCount: number;
    totalTime: number;
    averageTime: number;
  }>();

  return {
    trackRender(componentName: string, renderTime: number) {
      const existing = components.get(componentName) || {
        renderCount: 0,
        totalTime: 0,
        averageTime: 0
      };
      
      existing.renderCount += 1;
      existing.totalTime += renderTime;
      existing.averageTime = existing.totalTime / existing.renderCount;
      
      components.set(componentName, existing);
    },
    
    getAnalysis() {
      return Array.from(components.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.totalTime - a.totalTime);
    }
  };
}

// Performance optimization helpers
export const PerformanceHelpers = {
  // Memoize callback with dependencies
  useStableCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]): T => {
    return useCallback(callback, deps);
  },

  // Memoize object to prevent re-renders
  useStableObject: <T extends Record<string, any>>(obj: T): T => {
    return useMemo(() => obj, [JSON.stringify(obj)]);
  },

  // Lazy load component
  lazifyComponent: (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => {
    return React.lazy(importFunc);
  },

  // Preload component
  preloadComponent: async (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => {
    try {
      await importFunc();
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  }
};

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    renderTime: 16, // 60fps
    memoryUsage: 50 * 1024 * 1024, // 50MB
    bundleSize: 1024 * 1024, // 1MB
    firstContentfulPaint: 1500, // 1.5s
    largestContentfulPaint: 2500 // 2.5s
  };

  static checkBudget(metric: keyof typeof PerformanceBudget.budgets, value: number): boolean {
    const budget = this.budgets[metric];
    const isWithinBudget = value <= budget;
    
    if (!isWithinBudget) {
      console.warn(`📊 Performance budget exceeded: ${metric} = ${value}, budget = ${budget}`);
    }
    
    return isWithinBudget;
  }

  static setBudget(metric: keyof typeof PerformanceBudget.budgets, value: number): void {
    this.budgets[metric] = value;
  }
}

// Memory usage tracker
export function useMemoryTracker() {
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize);
        
        PerformanceBudget.checkBudget('memoryUsage', memory.usedJSHeapSize);
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}

// Export default performance toolkit
export default {
  performanceMonitor,
  withPerformanceMonitoring,
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useExpensiveMemo,
  useVirtualScrolling,
  analyzeComponentRenders,
  PerformanceHelpers,
  PerformanceBudget,
  useMemoryTracker
};

// أنواع مختلفة من Loading Fallbacks حسب النوع
export const createLoadingFallback = (message: string, type: 'page' | 'component' | 'modal' = 'page'): React.ReactElement => {
  const sizeClass = {
    page: 'min-h-[60vh]',
    component: 'min-h-[200px]',
    modal: 'min-h-[150px]'
  }[type];

  return React.createElement(
    'div',
    { className: `flex flex-col items-center justify-center ${sizeClass} space-y-4` },
    React.createElement(
      'div',
      { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' }
    ),
    React.createElement(
      'p',
      { className: 'text-sm text-gray-600 dark:text-gray-400 font-medium' },
      message
    )
  );
};

// Lazy loading مع preloading ذكي
export const createSmartLazy = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preloadOnHover?: boolean;
    preloadDelay?: number;
    fallbackMessage?: string;
    priority?: 'high' | 'medium' | 'low';
  } = {}
): LazyExoticComponent<T> => {
  const {
    preloadOnHover = true,
    preloadDelay = 200,
    fallbackMessage = 'جارٍ التحميل...',
    priority = 'medium'
  } = options;

  const LazyComponent = lazy(importFn);

  // Preload function
  const preload = () => {
    if (priority === 'high') {
      // Immediate preload for high priority
      importFn();
    } else {
      // Delayed preload for others
      setTimeout(() => {
        importFn();
      }, preloadDelay);
    }
  };

  // Add preload method to component
  (LazyComponent as any).preload = preload;

  return LazyComponent;
};

// Performance tracking utilities
export const performanceUtils = {
  // Track component mount time
  trackComponentMount: (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const mountTime = endTime - startTime;
      
      if (mountTime > 100) { // Log if mount takes > 100ms
        console.warn(`Component ${componentName} took ${mountTime.toFixed(2)}ms to mount`);
      }
      
      // Store in performance metrics
      if ('performance' in window && 'measure' in performance) {
        performance.mark(`${componentName}-mount-end`);
        performance.measure(`${componentName}-mount`, `${componentName}-mount-start`, `${componentName}-mount-end`);
      }
    };
  },

  // Track route transition time
  trackRouteTransition: (fromRoute: string, toRoute: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      console.log(`Route transition from ${fromRoute} to ${toRoute}: ${transitionTime.toFixed(2)}ms`);
    };
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }
};

// Bundle splitting utilities
export const bundleOptimization = {
  // Preload critical resources
  preloadCriticalResources: () => {
    // Preload fonts
    const fontLinks = [
      '/fonts/Amiri-Regular.ttf',
      '/fonts/Amiri-Bold.ttf'
    ];

    fontLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/ttf';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  // Prefetch next likely routes
  prefetchRoutes: (routes: string[]) => {
    routes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }
};

// Code splitting strategies
export const codeSplittingStrategies = {
  // Route-based splitting
  byRoute: (routeName: string) => ({
    fallbackMessage: `جارٍ تحميل صفحة ${routeName}...`,
    priority: 'medium' as const,
    preloadOnHover: true
  }),

  // Feature-based splitting
  byFeature: (featureName: string) => ({
    fallbackMessage: `جارٍ تحميل ${featureName}...`,
    priority: 'low' as const,
    preloadOnHover: false
  }),

  // Component-based splitting
  byComponent: (componentName: string) => ({
    fallbackMessage: `جارٍ تحميل ${componentName}...`,
    priority: 'high' as const,
    preloadOnHover: true,
    preloadDelay: 100
  })
};

// Image optimization utilities
export const imageOptimization = {
  // Lazy load images with intersection observer
  createLazyImage: (src: string, alt: string, placeholder?: string) => {
    return {
      src: placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'data-src': src,
      alt,
      loading: 'lazy' as const,
      className: 'lazy-image'
    };
  },

  // Preload critical images
  preloadImages: (imageUrls: string[]) => {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

// Cache optimization
export const cacheOptimization = {
  // Service worker cache strategies
  cacheStrategies: {
    // Cache first for static assets
    cacheFirst: ['fonts', 'images', 'css'],
    
    // Network first for API data
    networkFirst: ['api', 'graphql'],
    
    // Stale while revalidate for semi-static content
    staleWhileRevalidate: ['pages', 'components']
  },

  // Local storage optimization
  optimizeLocalStorage: () => {
    // Clean old cache entries
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && (now - item.timestamp) > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }
};

// Performance scoring
export const performanceScoring = {
  // Calculate performance score based on various metrics
  calculateScore: () => {
    const metrics = {
      memory: performanceUtils.getMemoryUsage(),
      timing: performance.timing,
      navigation: performance.navigation
    };

    let score = 100;

    // Memory usage penalty
    if (metrics.memory) {
      const memoryUsagePercent = (metrics.memory.used / metrics.memory.limit) * 100;
      if (memoryUsagePercent > 80) score -= 20;
      else if (memoryUsagePercent > 60) score -= 10;
    }

    // Load time penalty
    const loadTime = metrics.timing.loadEventEnd - metrics.timing.navigationStart;
    if (loadTime > 3000) score -= 15;
    else if (loadTime > 2000) score -= 10;
    else if (loadTime > 1000) score -= 5;

    return Math.max(0, Math.min(100, score));
  },

  // Get performance recommendations
  getRecommendations: () => {
    const recommendations = [];
    const memory = performanceUtils.getMemoryUsage();
    
    if (memory) {
      const memoryUsagePercent = (memory.used / memory.limit) * 100;
      if (memoryUsagePercent > 80) {
        recommendations.push('استخدام الذاكرة مرتفع. فكر في تقليل المكونات المحملة.');
      }
    }

    const paintMetrics = performance.getEntriesByType('paint');
    const fcp = paintMetrics.find(metric => metric.name === 'first-contentful-paint');
    
    if (fcp && fcp.startTime > 1500) {
      recommendations.push('وقت رسم المحتوى الأول بطيء. استخدم lazy loading أكثر.');
    }

    return recommendations;
  }
}; 