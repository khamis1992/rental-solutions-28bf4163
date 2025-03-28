
/**
 * Performance monitoring utility for tracking and analyzing application performance
 */
import { useEffect } from 'react';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

// Store for collected metrics
const metrics: PerformanceMetric[] = [];

// Maximum number of metrics to store to prevent memory leaks
const MAX_METRICS = 1000;

/**
 * Start measuring a performance metric
 * @param name Unique identifier for the performance metric
 * @param metadata Optional additional data to store with the metric
 * @returns Function to stop the measurement and record the duration
 */
export const startMeasure = (name: string, metadata?: Record<string, any>) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    
    if (metrics.length >= MAX_METRICS) {
      metrics.shift(); // Remove oldest metric if we hit the limit
    }
    
    metrics.push({
      name,
      startTime,
      duration,
      metadata
    });
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
    
    return duration;
  };
};

/**
 * Get all collected metrics
 */
export const getMetrics = () => {
  return [...metrics];
};

/**
 * Get metrics filtered by name
 */
export const getMetricsByName = (name: string) => {
  return metrics.filter(metric => metric.name === name);
};

/**
 * Calculate statistics for metrics with the given name
 */
export const getMetricStats = (name: string) => {
  const filteredMetrics = getMetricsByName(name);
  if (filteredMetrics.length === 0) return null;
  
  const durations = filteredMetrics.map(m => m.duration);
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  
  return {
    count: filteredMetrics.length,
    average: total / filteredMetrics.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    total
  };
};

/**
 * Clear all metrics
 */
export const clearMetrics = () => {
  metrics.length = 0;
};

/**
 * Track a React component render time using a useEffect hook
 */
export const useComponentPerformance = (componentName: string, metadata?: Record<string, any>) => {
  // This needs to be used inside a React component
  useEffect(() => {
    const endMeasure = startMeasure(`component:${componentName}`, metadata);
    return endMeasure;
  }, []);
};

/**
 * Track API request performance
 */
export const trackApiPerformance = async <T,>(
  requestName: string, 
  requestFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const endMeasure = startMeasure(`api:${requestName}`, metadata);
  try {
    const result = await requestFn();
    endMeasure();
    return result;
  } catch (error) {
    endMeasure();
    throw error;
  }
};
