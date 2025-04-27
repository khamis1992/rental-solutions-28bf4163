
import React, { Component, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { useErrorStore } from '@/store/useErrorStore';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to our centralized error store
    try {
      useErrorStore.getState().addError({
        message: error.message,
        stack: error.stack,
        componentName: this.props.componentName || 'Unknown Component',
        severity: 'error',
        handled: true,
        context: { errorInfo: errorInfo.componentStack }
      });
    } catch (e) {
      // Fallback to console if store access fails
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Update component state
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = 3;
      const canRetry = this.state.retryCount < maxRetries;
      
      return (
        <div className="p-4 border rounded-md bg-destructive/10">
          <h3 className="font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {canRetry ? (
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Try again
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Too many retry attempts. Please refresh the page.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook for functional components
export function useErrorBoundary() {
  const throwError = React.useCallback((error: Error) => {
    throw error;
  }, []);

  return { throwError };
}
