import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: Date;
}

export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: new Date()
    };
    
    metricsRef.current.push(metric);
    
    // Log slow renders (> 100ms)
    if (renderTime > 100) {
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    // Send metrics to analytics in production
    if (import.meta.env.PROD) {
      // Analytics service call here
      sendPerformanceMetric(metric);
    }
  });

  const getMetrics = () => metricsRef.current;
  const getAverageRenderTime = () => {
    const times = metricsRef.current.map(m => m.renderTime);
    return times.reduce((a, b) => a + b, 0) / times.length;
  };

  return { getMetrics, getAverageRenderTime };
};

const sendPerformanceMetric = async (metric: PerformanceMetrics) => {
  try {
    // Send to your analytics service
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  } catch (error) {
    console.error('Failed to send performance metric:', error);
  }
}; 