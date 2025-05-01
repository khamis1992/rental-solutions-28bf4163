
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DatabaseResponseHandlerProps<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  loadingMessage?: string;
  errorComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * A component that handles rendering states of database responses
 * This helps standardize the handling of loading, error and empty states
 * across the application
 */
export function DatabaseResponseHandler<T>({
  isLoading,
  error,
  data,
  loadingMessage = 'Loading data...',
  errorComponent,
  children,
  emptyState,
  loadingComponent
}: DatabaseResponseHandlerProps<T>) {
  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'An error occurred while fetching data'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Success state with data
  return <>{children(data)}</>;
}
