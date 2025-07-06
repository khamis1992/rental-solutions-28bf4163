import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Performance optimization utilities
 */

// Optimized lazy loading with preload capability
export const createOptimizedLazy = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preload = false
) => {
  const LazyComponent = lazy(importFn);
  
  // Preload component if requested
  if (preload) {
    importFn();
  }
  
  return LazyComponent;
};

// Optimized Suspense wrapper
export const OptimizedSuspense = ({ children, fallback }: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback || <LoadingSpinner />}>
    {children}
  </Suspense>
);

// Pre-load critical components
export const preloadCriticalComponents = () => {
  // Preload most commonly used components
  import('@/components/agreements/AgreementList');
  import('@/components/customers/CustomerList');
  import('@/components/vehicles/VehicleGrid');
  import('@/components/dashboard/DashboardContent');
};

// Type-safe component wrapper
export const withTypeOptimization = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P) => <Component {...props} />;
};

// Error boundary for lazy loaded components
export class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>حدث خطأ في تحميل المكون</div>;
    }

    return this.props.children;
  }
}