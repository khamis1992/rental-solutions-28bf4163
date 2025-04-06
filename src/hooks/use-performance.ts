
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
