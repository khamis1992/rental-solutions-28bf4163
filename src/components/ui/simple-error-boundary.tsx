
import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SimpleErrorBoundary extends Component<SimpleErrorBoundaryProps, SimpleErrorBoundaryState> {
  constructor(props: SimpleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SimpleErrorBoundaryState {
    console.error('Error boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary details:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">An error occurred while loading the application.</p>
              <p className="text-sm mb-4">{this.state.error?.message}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload App
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
