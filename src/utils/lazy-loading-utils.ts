import { lazy, LazyExoticComponent, ComponentType } from 'react';

// أنواع مختلفة من Loading Fallbacks حسب النوع
export const createLoadingFallback = (message: string, type: 'page' | 'component' | 'modal' = 'page') => {
  const sizeClass = {
    page: 'min-h-[60vh]',
    component: 'min-h-[200px]',
    modal: 'min-h-[150px]'
  }[type];

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClass} space-y-4`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{message}</p>
    </div>
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

// Performance monitoring utilities
export const performanceMonitor = {
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

// Performance scoring
export const performanceScoring = {
  // Calculate performance score based on various metrics
  calculateScore: () => {
    const metrics = {
      memory: performanceMonitor.getMemoryUsage(),
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
    const memory = performanceMonitor.getMemoryUsage();
    
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