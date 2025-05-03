
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /**
   * The children to render
   */
  children: ReactNode;

  /**
   * Custom fallback UI to render when an error occurs
   */
  fallback?: ReactNode;

  /**
   * Callback to execute when an error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Keys to watch for changes to reset the error state
   */
  resetKeys?: any[];

  /**
   * Whether to show a toast notification when an error occurs
   */
  showToast?: boolean;

  /**
   * Custom error message to display
   */
  errorMessage?: string;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;

  /**
   * The error that occurred
   */
  error: Error | null;
}

/**
 * Error boundary component to catch and handle errors in React components
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Show toast notification if enabled
    if (this.props.showToast) {
      toast.error('An error occurred', {
        description: this.props.errorMessage || error.message || 'Please try again or refresh the page',
        duration: 5000,
      });
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // If any of the resetKeys changed, reset the error state
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.state.hasError &&
      this.props.resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx])
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default fallback UI
      return (
        <Alert variant="destructive" className="my-4 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-lg font-semibold mb-2">Something went wrong</AlertTitle>
              <AlertDescription>
                <p className="mb-4 text-sm opacity-90">
                  {this.props.errorMessage || this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      );
    }

    // If there's no error, render children
    return this.props.children;
  }
}

export default ErrorBoundary;
