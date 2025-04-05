
import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

/**
 * Creates a lazily loaded component with suspense and error boundaries
 * @param importFn Function that imports the component
 * @param options Configuration options
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFn);
  
  const defaultFallback = (
    <div className="p-4 w-full">
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
  
  const defaultError = (
    <div className="p-4 text-destructive bg-destructive/10 rounded-md">
      <h4 className="font-semibold">Error loading component</h4>
      <p>There was an error loading this component. Please try again later.</p>
    </div>
  );
  
  const Fallback = options.fallback || defaultFallback;
  const ErrorComponent = options.errorComponent || defaultError;

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={Fallback}>
      <ErrorBoundary fallback={ErrorComponent}>
        <LazyComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
