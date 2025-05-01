
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTypedErrorHandling } from '@/hooks/use-typed-error-handling';
import { Loader2 } from 'lucide-react';

// Simulate different error types
const simulateApiError = (): Promise<never> => 
  Promise.reject({ 
    message: 'API connection timed out', 
    statusCode: 504,
    endpoint: '/api/data'
  });

const simulateDatabaseError = (): Promise<never> => 
  Promise.reject({ 
    message: 'Foreign key constraint violation', 
    table: 'leases',
    operation: 'insert',
    details: { constraint: 'fk_vehicle_id' }
  });

const simulateValidationError = (): Promise<never> => 
  Promise.reject({ 
    message: 'Invalid input data', 
    field: 'email',
    constraints: { format: 'Must be a valid email' }
  });

const simulateGenericError = (): Promise<never> => 
  Promise.reject(new Error('Something went wrong'));

export function TypedErrorDemo() {
  const { 
    errorState, 
    isLoading, 
    clearErrors, 
    runWithErrorHandling,
    withTypedHandling
  } = useTypedErrorHandling({ showToast: true });
  
  const [result, setResult] = React.useState<string | null>(null);
  
  const handleApiErrorClick = async () => {
    await runWithErrorHandling(simulateApiError);
  };
  
  const handleDbErrorClick = async () => {
    await runWithErrorHandling(simulateDatabaseError);
  };
  
  const handleValidationErrorClick = async () => {
    await runWithErrorHandling(simulateValidationError);
  };
  
  const handleGenericErrorClick = async () => {
    await runWithErrorHandling(simulateGenericError);
  };
  
  const handleTypedErrorHandlingClick = async () => {
    try {
      // Using the withTypedHandling function with specific handlers
      const result = await withTypedHandling(
        // This will fail with a database error
        simulateDatabaseError,
        {
          // Handle each error type differently
          onApiError: (apiError) => {
            return `Handled API error: ${apiError.statusCode} - ${apiError.message}`;
          },
          onDatabaseError: (dbError) => {
            // Return something different based on the database table
            return `Handled Database error on table ${dbError.table}: ${dbError.message}`;
          },
          onValidationError: (valError) => {
            return `Handled Validation error in field ${valError.field}: ${valError.message}`;
          },
          onUnknownError: (unknownError) => {
            return `Handled Unknown error: ${unknownError.message}`;
          }
        },
        "Default value if no handler matches"
      );
      
      setResult(result);
    } catch (error) {
      setResult(`Error was not handled: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Type-Safe Error Handling Demo</CardTitle>
        <CardDescription>
          Test different error types with discriminated unions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleApiErrorClick} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simulate API Error
          </Button>
          
          <Button onClick={handleDbErrorClick} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simulate DB Error
          </Button>
          
          <Button onClick={handleValidationErrorClick} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simulate Validation Error
          </Button>
          
          <Button onClick={handleGenericErrorClick} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simulate Generic Error
          </Button>
        </div>
        
        <Button onClick={handleTypedErrorHandlingClick} disabled={isLoading} className="w-full">
          Test Discriminated Union Handlers
        </Button>
        
        {result && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-4">
            <p className="font-mono text-sm break-all">{result}</p>
          </div>
        )}
        
        {errorState.hasError && (
          <div className="border border-red-200 rounded-md p-4 bg-red-50 dark:bg-red-900/20">
            <h3 className="text-lg font-semibold mb-2">Captured Errors:</h3>
            
            {errorState.apiErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="font-medium">API Errors:</h4>
                <ul className="list-disc pl-5">
                  {errorState.apiErrors.map((err, index) => (
                    <li key={`api-${index}`}>
                      {err.statusCode}: {err.message} {err.endpoint ? `(${err.endpoint})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {errorState.dbErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="font-medium">Database Errors:</h4>
                <ul className="list-disc pl-5">
                  {errorState.dbErrors.map((err, index) => (
                    <li key={`db-${index}`}>
                      {err.operation} on {err.table}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {errorState.validationErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="font-medium">Validation Errors:</h4>
                <ul className="list-disc pl-5">
                  {errorState.validationErrors.map((err, index) => (
                    <li key={`val-${index}`}>
                      {err.field ? `${err.field}: ` : ''}{err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {errorState.otherErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="font-medium">Other Errors:</h4>
                <ul className="list-disc pl-5">
                  {errorState.otherErrors.map((err, index) => (
                    <li key={`other-${index}`}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button onClick={clearErrors} variant="outline" className="w-full">
          Clear Errors
        </Button>
      </CardFooter>
    </Card>
  );
}
