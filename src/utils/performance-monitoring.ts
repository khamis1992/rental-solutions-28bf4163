/**
 * Performance monitoring utility functions for application-wide usage
 */

// Store API request timings for analysis with improved memory management
const apiTimings: Record<string, number[]> = {};
const MAX_TIMING_SAMPLES = 20;
const TIMING_THRESHOLD_MS = 1000; // Log warning for API calls taking longer than 1 second

/**
 * Track API request timing with additional performance checks
 * @param endpoint The API endpoint or query key
 * @param timeMs The time taken in milliseconds 
 */
export function trackApiTiming(endpoint: string, timeMs: number): void {
  if (!apiTimings[endpoint]) {
    apiTimings[endpoint] = [];
  }
  
  apiTimings[endpoint].push(timeMs);
  
  // Keep only the last MAX_TIMING_SAMPLES timings to avoid memory issues
  if (apiTimings[endpoint].length > MAX_TIMING_SAMPLES) {
    apiTimings[endpoint] = apiTimings[endpoint].slice(-MAX_TIMING_SAMPLES);
  }
  
  // Log warning for slow API calls
  if (timeMs > TIMING_THRESHOLD_MS) {
    console.warn(`Slow API call detected: ${endpoint} took ${timeMs.toFixed(2)}ms`);
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
 * Get all recorded API timings with detailed statistics
 * @returns Record of all API timings with statistics
 */
export function getAllApiTimings(): Record<string, { 
  avg: number; 
  min: number; 
  max: number;
  count: number;
  p95: number; // 95th percentile for better outlier detection
}> {
  const result: Record<string, { 
    avg: number; 
    min: number; 
    max: number; 
    count: number;
    p95: number;
  }> = {};
  
  Object.entries(apiTimings).forEach(([endpoint, times]) => {
    if (times.length === 0) return;
    
    // Sort times for percentile calculation
    const sortedTimes = [...times].sort((a, b) => a - b);
    
    const sum = times.reduce((total, time) => total + time, 0);
    const avg = sum / times.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    
    // Calculate 95th percentile
    const p95Index = Math.ceil(times.length * 0.95) - 1;
    const p95 = sortedTimes[p95Index];
    
    result[endpoint] = { avg, min, max, count: times.length, p95 };
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
 * Track component render time with component path information
 * @param componentName Name of the component
 * @param callback Function to measure
 * @returns Result of the callback function
 */
export function trackRenderTime<T>(componentName: string, callback: () => T): T {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  const duration = end - start;
  
  // Log more detailed information for slow renders
  if (duration > 50) { // 50ms is a reasonable threshold for render performance concerns
    console.debug(`[Slow Render] ${componentName}: ${duration.toFixed(2)}ms`);
  } else {
    console.debug(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Measure and log the performance of any arbitrary function
 * @param name Identifier for the operation
 * @param fn Function to measure
 * @returns Result of the function
 */
export async function measurePerformance<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[Performance Error] ${name}: ${(end - start).toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Initialize performance monitoring
 * Sets up core Web Vitals monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;
  
  // Report real user metrics if supported
  try {
    // Use proper imports for web-vitals
    import('web-vitals')
      .then((webVitals) => {
        // Use onCLS, onFID, and onLCP from web-vitals v3.x
        webVitals.onCLS(metric => console.log('CLS:', metric.value));
        webVitals.onFID(metric => console.log('FID:', metric.value));
        webVitals.onLCP(metric => console.log('LCP:', metric.value));
        
        // Additional vitals when available
        if (webVitals.onINP) {
          webVitals.onINP(metric => console.log('INP:', metric.value));
        }
        if (webVitals.onTTFB) {
          webVitals.onTTFB(metric => console.log('TTFB:', metric.value));
        }
      })
      .catch(error => {
        console.warn('Failed to load web-vitals:', error);
      });
  } catch (e) {
    console.warn('Web Vitals monitoring failed to initialize:', e);
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
      
      // Also observe resource loading performance
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) { // 1000ms threshold for slow resources
            console.warn(`Slow resource load: ${resource.name} (${resource.duration.toFixed(2)}ms)`);
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.error('Performance observer not supported', e);
    }
  }
  
  // Initialize monitoring on page load
  if (document.readyState === 'complete') {
    console.info('[Performance] Performance monitoring initialized');
  } else {
    window.addEventListener('load', () => {
      console.info('[Performance] Performance monitoring initialized');
    });
  }
}
