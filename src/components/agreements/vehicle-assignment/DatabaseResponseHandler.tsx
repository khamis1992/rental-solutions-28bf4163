
import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface DatabaseResponseHandlerProps<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  loadingView?: ReactNode;
  errorView?: ReactNode | ((error: Error) => ReactNode);
  emptyView?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * A component that handles common database response patterns
 * including loading states, errors, and empty data
 */
export function DatabaseResponseHandler<T>({
  data,
  isLoading,
  error,
  loadingView,
  errorView,
  emptyView,
  children
}: DatabaseResponseHandlerProps<T>) {
  // Loading state
  if (isLoading) {
    return loadingView || (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    if (typeof errorView === 'function') {
      return <>{errorView(error)}</>;
    }
    return errorView || (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h4 className="font-medium">Error loading data</h4>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyView || (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }
  
  // Render children with data
  return <>{children(data)}</>;
}
