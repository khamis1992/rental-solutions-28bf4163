
import { useState, useEffect } from 'react';
import { PerformanceMonitor } from '@/utils/performance-monitor';

export const usePerformanceMeasure = (operationName: string) => {
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    PerformanceMonitor.startMeasure(operationName);
    
    return () => {
      const metrics = PerformanceMonitor.getMetrics(operationName);
      if (metrics.length > 0) {
        setDuration(metrics[metrics.length - 1]);
      }
      PerformanceMonitor.clearMetrics(operationName);
    };
  }, [operationName]);

  return { duration };
};
import { useEffect, useRef } from 'react';
import { PerformanceMonitor } from '@/utils/performance-monitor';

const PERFORMANCE_THRESHOLDS = {
  FPS: 30,
  MEMORY: 90,
  CPU: 80,
  NETWORK: 1000,
};

export function usePerformanceMonitoring(componentName: string) {
  const mountTime = useRef(performance.now());

  useEffect(() => {
    PerformanceMonitor.startMeasure(`${componentName}_mount`);
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > PERFORMANCE_THRESHOLDS.NETWORK) {
          console.warn(`Slow network request detected: ${entry.name}`);
        }
      });
    });

    observer.observe({ entryTypes: ['resource', 'navigation'] });

    return () => {
      PerformanceMonitor.endMeasure(`${componentName}_mount`);
      observer.disconnect();
    };
  }, [componentName]);

  return {
    measureOperation: (operationName: string) => {
      PerformanceMonitor.startMeasure(`${componentName}_${operationName}`);
      return () => PerformanceMonitor.endMeasure(`${componentName}_${operationName}`);
    }
  };
}
