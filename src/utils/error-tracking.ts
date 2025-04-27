
import { useErrorStore, ErrorEvent } from '@/store/useErrorStore';

/**
 * Error logging utility function
 * Centralizes error tracking and provides consistent format
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>, 
  componentName?: string,
  severity: 'error' | 'warning' | 'info' = 'error'
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;
  
  // Log to console first
  console.error(`[${componentName || 'App'}] ${errorMessage}`, context);
  
  // Add to centralized error store
  useErrorStore.getState().addError({
    message: errorMessage,
    stack: errorStack,
    componentName,
    context,
    severity,
    handled: false
  });
  
  // This could be extended to send errors to a monitoring service
  // like Sentry in the future
}

/**
 * Handle rejected promises from async operations
 * Can be used in try/catch blocks to standardize error handling
 */
export function handleRejection<T>(
  promise: Promise<T>,
  componentName?: string,
  context?: Record<string, any>
): Promise<[T | null, Error | null]> {
  return promise
    .then((data) => [data, null])
    .catch((error) => {
      logError(error, context, componentName);
      return [null, error];
    });
}

/**
 * Error boundary HOC wrapper for component-level error handling
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  class WithErrorBoundary extends React.Component<P, { hasError: boolean; error: Error | null }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Log the error
      logError(error, { errorInfo }, displayName);
      
      // Call the optional error handler
      if (onError) {
        onError(error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        // Either use the provided fallback or a default error message
        return fallback || (
          <div className="p-4 border rounded-md bg-destructive/10">
            <h3 className="font-semibold mb-2">Something went wrong in {displayName}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              className="px-3 py-1 text-xs border rounded hover:bg-accent"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  }

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}

/**
 * Use this to wrap fetch calls for consistent error handling
 */
export async function safeFetch<T>(
  url: string, 
  options?: RequestInit, 
  context?: Record<string, any>
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 
      { url, options, ...context }, 'safeFetch');
    return null;
  }
}
