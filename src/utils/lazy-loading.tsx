
import React from 'react';

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

// Utility function to create lazily-loaded components with error boundaries
export function lazyLoad(
  importFunction: () => Promise<{ default: React.ComponentType<any> }>,
  LoadingComponent: React.FC<LoadingComponentProps> = DefaultLoadingComponent,
  loadingMessage?: string
) {
  const LazyComponent = React.lazy(importFunction);
  
  return (props: any) => (
    <React.Suspense fallback={<LoadingComponent message={loadingMessage} />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
}
