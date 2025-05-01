
import React, { useState } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import errorService from '@/services/error/ErrorService';

// Component that will throw an error when rendered
const ComponentWithError = () => {
  throw new Error('This is a simulated render error');
  return <div>You should never see this</div>;
};

export const ErrorDemo: React.FC = () => {
  const { addError, errors, clearErrors } = useError();
  const [throwRenderError, setThrowRenderError] = useState(false);
  
  const triggerInfoError = () => {
    addError({
      message: 'This is an informational message',
      severity: 'info',
      category: 'business',
      source: 'ErrorDemo',
    });
  };
  
  const triggerWarningError = () => {
    addError({
      message: 'This is a warning message',
      severity: 'warning',
      category: 'validation',
      source: 'ErrorDemo',
      details: 'Additional details about the warning',
    });
  };
  
  const triggerError = () => {
    addError({
      message: 'This is an error message',
      severity: 'error',
      category: 'api',
      code: 'DEMO-123',
      source: 'ErrorDemo',
      details: 'This is a simulated error for demonstration purposes',
    });
  };
  
  const triggerApiError = () => {
    errorService.handleApiError(
      new Error('Failed to fetch data from API'),
      'API Demo'
    );
  };
  
  const triggerNetworkError = () => {
    errorService.handleNetworkError(
      new Error('Network connection lost'),
      'Network Demo'
    );
  };
  
  const triggerValidationError = () => {
    errorService.handleValidationError(
      {
        username: ['Must be at least 3 characters'],
        password: ['Must be at least 8 characters', 'Must include a number']
      },
      'Form Demo'
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error Handling Demo</CardTitle>
        <CardDescription>
          This component demonstrates the error handling system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={triggerInfoError} variant="outline">
            Show Info Message
          </Button>
          <Button onClick={triggerWarningError} variant="outline">
            Show Warning Message
          </Button>
          <Button onClick={triggerError} variant="outline">
            Show Error Message
          </Button>
          <Button onClick={triggerApiError} variant="outline">
            Simulate API Error
          </Button>
          <Button onClick={triggerNetworkError} variant="outline">
            Simulate Network Error
          </Button>
          <Button onClick={triggerValidationError} variant="outline">
            Simulate Validation Error
          </Button>
          <Button 
            onClick={() => setThrowRenderError(true)} 
            variant="destructive"
          >
            Trigger Error Boundary
          </Button>
        </div>
        
        <div className="mt-6 border rounded p-4">
          <h3 className="font-medium mb-2">Error Boundary Example</h3>
          <SectionErrorBoundary title="Error Demo Section">
            {throwRenderError ? <ComponentWithError /> : <p>No render error yet</p>}
          </SectionErrorBoundary>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Error Log ({errors.length})</h3>
          {errors.length > 0 ? (
            <div className="bg-slate-50 p-4 rounded max-h-40 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(
                  errors.map(({ id, message, severity, timestamp, source }) => ({
                    id,
                    timestamp: timestamp.toISOString(),
                    severity,
                    source,
                    message,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground">No errors logged</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={clearErrors}>
          Clear All Errors
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ErrorDemo;
