
import { ErrorEvent } from '@/store/useErrorStore';
import { useErrorStore } from '@/store/useErrorStore';
import { toast } from 'sonner';
import React from 'react';

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
  
  // Log to console first with full context
  console.error(`[${componentName || 'App'}] ${errorMessage}`, context);
  
  // Add to centralized error store with metadata
  useErrorStore.getState().addError({
    message: errorMessage,
    stack: errorStack,
    componentName,
    context,
    severity,
    handled: false
  });
  
  // Show user-facing notification for critical errors
  if (severity === 'error') {
    toast.error(errorMessage);
  }
}

/**
 * Handle rejected promises from async operations
 * Can be used in try/catch blocks to standardize error handling
 */
export async function handleRejection<T>(
  promise: Promise<T>,
  componentName?: string,
  context?: Record<string, any>
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError(err, context, componentName);
    return [null, err];
  }
}

/**
 * Type-safe error boundary wrapper for components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  return class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean; error: Error | null }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logError(error, { errorInfo }, componentName || Component.displayName || 'Unknown');
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 border rounded-md bg-destructive/10">
            <h3 className="font-semibold mb-2">Something went wrong</h3>
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
  };
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
