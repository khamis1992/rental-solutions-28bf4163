
import { useEffect, useRef } from 'react';
import { startMeasure } from '@/utils/performance-monitoring';

/**
 * Hook to measure component performance
 * @param componentName Name of the component to track
 * @param dependencies Optional array of dependencies to re-measure on changes
 * @param metadata Additional data to record with the metric
 */
export function usePerformance(
  componentName: string, 
  dependencies: React.DependencyList = [], 
  metadata?: Record<string, any>
) {
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    const label = isFirstRender.current 
      ? `component:${componentName}:mount` 
      : `component:${componentName}:update`;
    
    const endMeasure = startMeasure(label, metadata);
    isFirstRender.current = false;

    return () => {
      endMeasure();
    };
  }, dependencies);
  
  // For measuring unmount performance
  useEffect(() => {
    return () => {
      startMeasure(`component:${componentName}:unmount`, metadata)();
    };
  }, []);
}

/**
 * HOC to wrap a component with performance monitoring
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName = Component.displayName || Component.name
) {
  const WrappedComponent = (props: P) => {
    usePerformance(componentName);
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithPerformance(${componentName})`;
  return WrappedComponent;
}
