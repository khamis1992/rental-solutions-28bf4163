
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

const metrics: PerformanceMetric[] = [];

export const setUpMonitoring = (performance: Performance) => {
  // Basic performance monitoring setup
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metric = {
        name: entry.name,
        value: entry.duration || entry.startTime,
        timestamp: Date.now()
      };
      metrics.push(metric);
      console.log('Performance metric:', metric);
    }
  });

  // Observe different types of performance entries
  observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });

  return {
    getMetrics: () => metrics,
    clearMetrics: () => {
      metrics.length = 0;
    }
  };
};
