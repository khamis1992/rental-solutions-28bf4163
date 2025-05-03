import React from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for the DataFetcher component
 */
interface DataFetcherProps<T> {
  /**
   * The data to render
   */
  data: T | null | undefined;
  
  /**
   * Whether the data is loading
   */
  isLoading: boolean;
  
  /**
   * The error that occurred during data fetching
   */
  error: Error | null | unknown;
  
  /**
   * Function to render the data
   */
  children: (data: T) => React.ReactNode;
  
  /**
   * Function to retry data fetching
   */
  onRetry?: () => void;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;
  
  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode;
  
  /**
   * Whether to show a loading state
   */
  showLoading?: boolean;
  
  /**
   * Whether to show an error state
   */
  showError?: boolean;
  
  /**
   * Whether to show an empty state
   */
  showEmpty?: boolean;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Custom empty message
   */
  emptyMessage?: string;
}

/**
 * Default loading component
 */
const DefaultLoading = () => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Default error component
 */
const DefaultError = ({ 
  error, 
  onRetry, 
  errorMessage 
}: { 
  error: Error | null | unknown; 
  onRetry?: () => void;
  errorMessage?: string;
}) => (
  <Alert variant="destructive" className="my-4">
    <div className="flex items-start gap-4">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <AlertTitle className="text-lg font-semibold mb-2">Error loading data</AlertTitle>
        <AlertDescription>
          <p className="mb-4 text-sm opacity-90">
            {errorMessage || (error instanceof Error ? error.message : 'An unexpected error occurred')}
          </p>
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </div>
    </div>
  </Alert>
);

/**
 * Default empty component
 */
const DefaultEmpty = ({ emptyMessage }: { emptyMessage?: string }) => (
  <div className="text-center py-8 text-muted-foreground">
    <p>{emptyMessage || 'No data available'}</p>
  </div>
);

/**
 * Component for handling data fetching states (loading, error, empty, success)
 */
export function DataFetcher<T>({
  data,
  isLoading,
  error,
  children,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  showLoading = true,
  showError = true,
  showEmpty = true,
  errorMessage,
  emptyMessage,
}: DataFetcherProps<T>) {
  // Show loading state
  if (isLoading && showLoading) {
    return loadingComponent || <DefaultLoading />;
  }
  
  // Show error state
  if (error && showError) {
    return errorComponent || (
      <DefaultError 
        error={error} 
        onRetry={onRetry} 
        errorMessage={errorMessage} 
      />
    );
  }
  
  // Show empty state
  if ((!data || (Array.isArray(data) && data.length === 0)) && showEmpty) {
    return emptyComponent || <DefaultEmpty emptyMessage={emptyMessage} />;
  }
  
  // Show data
  return <>{data ? children(data as T) : null}</>;
}
