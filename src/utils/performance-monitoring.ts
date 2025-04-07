/**
 * Performance monitoring utility functions for application-wide usage
 */

// Store API request timings for analysis
const apiTimings: Record<string, number[]> = {};

/**
 * Track API request timing
 * @param endpoint The API endpoint or query key
 * @param timeMs The time taken in milliseconds 
 */
export function trackApiTiming(endpoint: string, timeMs: number) {
  if (!apiTimings[endpoint]) {
    apiTimings[endpoint] = [];
  }
  
  apiTimings[endpoint].push(timeMs);
  
  // Keep only the last 10 timings to avoid memory issues
  if (apiTimings[endpoint].length > 10) {
    apiTimings[endpoint] = apiTimings[endpoint].slice(-10);
  }
}

/**
 * Get average response time for an endpoint
 * @param endpoint The API endpoint or query key
 * @returns Average response time in milliseconds
 */
export function getAverageResponseTime(endpoint: string): number {
  const timings = apiTimings[endpoint];
  if (!timings || timings.length === 0) return 0;
  
  const sum = timings.reduce((total, time) => total + time, 0);
  return sum / timings.length;
}

/**
 * Get all recorded API timings
 * @returns Record of all API timings
 */
export function getAllApiTimings(): Record<string, { 
  avg: number; 
  min: number; 
  max: number;
  count: number;
}> {
  const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
  
  Object.entries(apiTimings).forEach(([endpoint, times]) => {
    if (times.length === 0) return;
    
    const sum = times.reduce((total, time) => total + time, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    result[endpoint] = { avg, min, max, count: times.length };
  });
  
  return result;
}

/**
 * Clear all recorded timing data
 */
export function clearApiTimings(): void {
  Object.keys(apiTimings).forEach(key => {
    delete apiTimings[key];
  });
}

/**
 * Track component render time
 * @param componentName Name of the component
 * @param callback Function to measure
 * @returns Result of the callback function
 */
export function trackRenderTime<T>(componentName: string, callback: () => T): T {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  
  console.debug(`[Render] ${componentName}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * Initialize performance monitoring
 * Sets up core Web Vitals monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;
  
  // Report real user metrics if supported
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(metric => console.log('CLS:', metric.value));
      getFID(metric => console.log('FID:', metric.value));
      getLCP(metric => console.log('LCP:', metric.value));
    });
  }
  
  // Monitor long tasks
  if (window.PerformanceObserver) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const duration = entry.duration;
          if (duration > 50) { // 50ms is considered a long task
            console.warn(`Long task detected: ${duration.toFixed(2)}ms`, entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Performance observer not supported', e);
    }
  }
}
