
import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
}

export const usePerformanceTracking = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  });

  useEffect(() => {
    const measurePerformance = () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
        const renderTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart;
        
        setMetrics(prev => ({
          ...prev,
          loadTime,
          renderTime
        }));
      }
    };

    if (typeof window !== 'undefined' && 'performance' in window) {
      measurePerformance();
    }
  }, []);

  return { metrics };
};
