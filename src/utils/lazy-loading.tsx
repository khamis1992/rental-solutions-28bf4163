
import React, { lazy, ComponentType, Suspense } from 'react';
import performanceMonitor from './performance-monitor';

// Interface for loading states to be displayed during lazy loading
export interface LoadingComponentProps {
  message?: string;
}

// Default loading component to show during code splitting
export const DefaultLoadingComponent: React.FC<LoadingComponentProps> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[200px] w-full">
    <div className="flex flex-col items-center space-y-2">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

/**
 * Enhanced lazy loading utility that automatically tracks component loading performance
 * and provides fallback UI during loading
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  LoadingComponent: React.FC<LoadingComponentProps> = DefaultLoadingComponent,
  loadingMessage?: string
) {
  const componentName = importFunction.toString().match(/import\(['"](.+)['"]\)/)?.[1] || 'Component';
  
  // Create wrapped import function that measures loading time
  const measuredImport = () => {
    performanceMonitor.startMeasure(`lazy_load_${componentName}`);
    
    return importFunction().then((module) => {
      performanceMonitor.endMeasure(`lazy_load_${componentName}`, true);
      return module;
    });
  };
  
  // Create lazy component with measurement
  const LazyComponent = lazy(measuredImport);
  
  // Return wrapped component
  return (props: React.ComponentProps<T>): JSX.Element => {
    return (
      <Suspense fallback={<LoadingComponent message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Creates a component that is only loaded when it enters the viewport
 */
export function lazyLoadWithIntersection<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options?: {
    LoadingComponent?: React.FC<LoadingComponentProps>;
    loadingMessage?: string;
    threshold?: number;
    rootMargin?: string;
  }
) {
  const {
    LoadingComponent = DefaultLoadingComponent,
    loadingMessage,
    threshold = 0.1,
    rootMargin = '100px'
  } = options || {};
  
  // Standard lazy load implementation
  const LazyComponent = lazyLoad(importFunction, LoadingComponent, loadingMessage);
  
  // Return intersection observer wrapped component
  return (props: React.ComponentProps<T>): JSX.Element => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      const currentRef = ref.current;
      if (!currentRef) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Stop observing once component should load
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );
      
      observer.observe(currentRef);
      
      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      };
    }, []);
    
    return (
      <div ref={ref}>
        {isVisible ? (
          <LazyComponent {...props} />
        ) : (
          <LoadingComponent message={loadingMessage || 'Loading...'} />
        )}
      </div>
    );
  };
}

