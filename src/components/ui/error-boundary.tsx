
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
    <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
      <div className="bg-muted p-4 rounded mb-4 overflow-auto max-h-[200px]">
        <p className="font-mono text-sm">{error.message}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </div>
    </div>
  </div>
);

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
