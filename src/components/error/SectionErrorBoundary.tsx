
import React, { ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useError } from '@/contexts/ErrorContext';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  resetDependencies?: any[];
  showReset?: boolean;
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({
  children,
  title,
  className,
  resetDependencies = [],
  showReset = true,
}) => {
  const { addError } = useError();
  
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    addError({
      message: `Error in ${title}: ${error.message}`,
      details: errorInfo.componentStack,
      severity: 'error',
      category: 'rendering',
      source: title,
    });
  };
  
  return (
    <ErrorBoundary 
      resetKeys={resetDependencies}
      onError={handleError}
      fallback={
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error in {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This section encountered an error and cannot be displayed.
            </p>
            {showReset && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Reload Page
              </Button>
            )}
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default SectionErrorBoundary;
