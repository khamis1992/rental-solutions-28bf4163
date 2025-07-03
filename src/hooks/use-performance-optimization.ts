/**
 * Hook مخصص لتحسين الأداء في المكونات الثقيلة
 * Custom hook for performance optimization in heavy components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { performanceMonitor } from '@/utils/performance-utils';

// Interface for performance optimization options
interface PerformanceOptimizationOptions {
  componentName: string;
  enableDebounce?: boolean;
  debounceDelay?: number;
  enableThrottle?: boolean;
  throttleDelay?: number;
  enableVirtualScrolling?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  trackMemory?: boolean;
  warnOnSlowRender?: boolean;
  slowRenderThreshold?: number;
}

// Performance optimization hook
export function usePerformanceOptimization(options: PerformanceOptimizationOptions) {
  const {
    componentName,
    enableDebounce = false,
    debounceDelay = 300,
    enableThrottle = false,
    throttleDelay = 100,
    enableVirtualScrolling = false,
    itemHeight = 50,
    containerHeight = 400,
    trackMemory = true,
    warnOnSlowRender = true,
    slowRenderThreshold = 16
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Track render performance
  useEffect(() => {
    const startTime = performance.now();
    renderCount.current += 1;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      lastRenderTime.current = renderTime;

      // Record metrics
      const metrics = {
        renderTime,
        componentCount: 1,
        rerenderCount: renderCount.current,
        timestamp: Date.now()
      };

      setPerformanceMetrics(metrics);
      performanceMonitor.recordMetrics(metrics);

      // Warn on slow renders
      if (warnOnSlowRender && renderTime > slowRenderThreshold) {
        console.warn(`🚨 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  // Track memory usage
  useEffect(() => {
    if (!trackMemory) return;

    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize);
      }
    };

    trackMemoryUsage();
    const interval = setInterval(trackMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, [trackMemory]);

  // Debounced value hook
  const createDebouncedValue = useCallback(<T>(value: T, delay: number = debounceDelay): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }, [debounceDelay]);

  // Throttled function hook
  const createThrottledFunction = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = throttleDelay
  ): T => {
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
  }, [throttleDelay]);

  // Virtual scrolling hook
  const createVirtualScrolling = useCallback((items: any[]) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleRange = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + 2
      );
      
      return { startIndex, endIndex };
    }, [scrollTop, items.length]);

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
  }, [itemHeight, containerHeight]);

  // Memoized calculation helper
  const createMemoizedCalculation = useCallback(<T>(
    calculation: () => T,
    dependencies: any[],
    calculationName?: string
  ): T => {
    return useMemo(() => {
      const start = performance.now();
      const result = calculation();
      const duration = performance.now() - start;

      if (duration > 5) {
        console.log(`🧮 ${calculationName || 'Calculation'} took ${duration.toFixed(2)}ms`);
      }

      return result;
    }, dependencies);
  }, []);

  // Performance summary
  const getPerformanceSummary = useCallback(() => {
    return {
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      memoryUsage,
      performanceMetrics
    };
  }, [componentName, memoryUsage, performanceMetrics]);

  // Optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions = [];

    if (lastRenderTime.current > 16) {
      suggestions.push('Consider using React.memo for this component');
    }

    if (renderCount.current > 10) {
      suggestions.push('Check if props are changing unnecessarily');
    }

    if (memoryUsage > 50 * 1024 * 1024) {
      suggestions.push('Memory usage is high, consider optimizing data structures');
    }

    return suggestions;
  }, [memoryUsage]);

  return {
    // Performance metrics
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    memoryUsage,
    performanceMetrics,
    
    // Optimization helpers
    createDebouncedValue: enableDebounce ? createDebouncedValue : null,
    createThrottledFunction: enableThrottle ? createThrottledFunction : null,
    createVirtualScrolling: enableVirtualScrolling ? createVirtualScrolling : null,
    createMemoizedCalculation,
    
    // Performance analysis
    getPerformanceSummary,
    getOptimizationSuggestions
  };
}

// Specialized hook for heavy lists
export function useHeavyListOptimization(options: {
  componentName: string;
  items: any[];
  itemHeight?: number;
  containerHeight?: number;
  enableVirtualScrolling?: boolean;
}) {
  const {
    componentName,
    items,
    itemHeight = 50,
    containerHeight = 400,
    enableVirtualScrolling = true
  } = options;

  const optimization = usePerformanceOptimization({
    componentName,
    enableVirtualScrolling,
    itemHeight,
    containerHeight,
    warnOnSlowRender: true,
    slowRenderThreshold: 16
  });

  const virtualScrolling = enableVirtualScrolling && optimization.createVirtualScrolling 
    ? optimization.createVirtualScrolling(items)
    : null;

  // Memoized filtered items
  const processedItems = useMemo(() => {
    if (virtualScrolling) {
      return virtualScrolling.visibleItems;
    }
    return items;
  }, [virtualScrolling, items]);

  return {
    ...optimization,
    processedItems,
    virtualScrolling,
    totalItems: items.length,
    visibleItems: virtualScrolling ? virtualScrolling.visibleItems.length : items.length
  };
}

// Specialized hook for forms
export function useFormOptimization(options: {
  componentName: string;
  enableDebounce?: boolean;
  debounceDelay?: number;
}) {
  const {
    componentName,
    enableDebounce = true,
    debounceDelay = 300
  } = options;

  const optimization = usePerformanceOptimization({
    componentName,
    enableDebounce,
    debounceDelay,
    warnOnSlowRender: true,
    slowRenderThreshold: 10
  });

  // Memoized form field wrapper
  const createOptimizedField = useCallback((
    FieldComponent: React.ComponentType<any>,
    fieldName: string
  ) => {
    const OptimizedField = React.memo((props: any) => {
      return <FieldComponent {...props} />;
    });
    
    OptimizedField.displayName = `Optimized${fieldName}Field`;
    return OptimizedField;
  }, []);

  return {
    ...optimization,
    createOptimizedField
  };
}

// Specialized hook for dashboard components
export function useDashboardOptimization(options: {
  componentName: string;
  refreshInterval?: number;
  enableThrottle?: boolean;
}) {
  const {
    componentName,
    refreshInterval = 30000,
    enableThrottle = true
  } = options;

  const optimization = usePerformanceOptimization({
    componentName,
    enableThrottle,
    throttleDelay: 1000,
    trackMemory: true,
    warnOnSlowRender: true,
    slowRenderThreshold: 20
  });

  // Auto-refresh with throttling
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Throttled refresh function
  const createThrottledRefresh = useCallback((refreshFunction: () => void) => {
    return optimization.createThrottledFunction
      ? optimization.createThrottledFunction(refreshFunction, 2000)
      : refreshFunction;
  }, [optimization.createThrottledFunction]);

  return {
    ...optimization,
    lastRefresh,
    createThrottledRefresh
  };
}

export default usePerformanceOptimization; 