import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { errorLogger } from '@/lib/errors/error-logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">We're sorry, but an unexpected error has occurred:</p>
            <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px]">
              {error.message}
            </pre>
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-2">
          <Button 
            onClick={resetErrorBoundary} 
            variant="outline" 
            className="flex-1"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLogger.logError(error, {
      context: 'ErrorBoundary',
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback 
          error={this.state.error!} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = (props: ErrorBoundaryProps) => {
  return <ErrorBoundaryClass {...props} />;
};
