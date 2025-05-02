
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/**
 * A demo component showing how to use the error notification system
 */
export function ErrorNotificationDemo() {
  const errorNotification = useErrorNotification();
  const [errorMessage, setErrorMessage] = useState('Connection error occurred');
  const [errorId, setErrorId] = useState('demo-error');
  
  const showBasicError = () => {
    errorNotification.showError('Error Occurred', {
      description: errorMessage,
      id: errorId
    });
  };
  
  const showDuplicateErrors = () => {
    // This will show multiple errors but the notification system will prevent fatigue
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        errorNotification.showError('Repeated Error', {
          description: `This is error ${i + 1} of 10. Notice how notifications are managed.`,
          id: 'repeated-error'
        });
      }, i * 300);
    }
  };
  
  const clearSpecificError = () => {
    errorNotification.clearError(errorId);
  };
  
  const clearAllErrors = () => {
    errorNotification.clearAllErrors();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error Notification System</CardTitle>
        <CardDescription>
          Demonstrates the notification system that prevents notification fatigue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label htmlFor="errorMessage">Error Message:</label>
            <Input
              id="errorMessage" 
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Enter error message"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="errorId">Error ID:</label>
            <Input
              id="errorId" 
              value={errorId}
              onChange={(e) => setErrorId(e.target.value)}
              placeholder="Enter error ID"
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={showBasicError} variant="outline">
          Show Error
        </Button>
        
        <Button onClick={showDuplicateErrors} variant="outline">
          Show Multiple (Anti-fatigue Demo)
        </Button>
        
        <Button onClick={clearSpecificError} variant="outline">
          Clear Specific Error
        </Button>
        
        <Button onClick={clearAllErrors} variant="destructive">
          Clear All Errors
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ErrorNotificationDemo;
