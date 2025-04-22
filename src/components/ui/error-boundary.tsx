import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-[50vh] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-destructive/5 rounded-lg p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <pre className="text-xs bg-destructive/10 p-4 rounded mb-4 overflow-auto max-h-32">
        {error.stack}
      </pre>
      <Button 
        onClick={resetErrorBoundary}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  </div>
);

const logError = (error: Error, info: { componentStack: string }) => {
  // In production, you would send this to your error tracking service
  console.error('Error caught by error boundary:', error);
  console.error('Component stack:', info.componentStack);
};

export const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || DefaultErrorFallback}
      onError={logError}
      onReset={() => {
        // Optional: Perform any cleanup or state reset here
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;