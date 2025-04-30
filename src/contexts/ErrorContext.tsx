import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { ApiResponse } from '@/types/api-response';

type ErrorContextType = {
  handleError: (error: unknown, context?: string) => void;
  handleApiResponse: <T>(response: ApiResponse<T>) => void;
};

const ErrorContext = createContext<ErrorContextType>({
  handleError: () => {},
  handleApiResponse: () => {}
});

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ReactNode[]>([]);

  const handleError = (error: unknown, context?: string) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(context ? `[${context}] Error:` : 'Error:', error);
    }

    // TODO: Add production error logging (Sentry/Bugsnag)
    
    // Show user-friendly message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    setToasts(prev => [
      ...prev,
      <Toast 
        key={Date.now()}
        variant="destructive"
        title={context || 'Error'}
        description={errorMessage}
      />
    ]);
  };

  const handleApiResponse = <T,>(response: ApiResponse<T>) => {
    if (!response.success) {
      handleError(response.error, response.message);
    }
  };

  return (
    <ErrorContext.Provider value={{ handleError, handleApiResponse }}>
      {children}
      <div className="toast-container">
        {toasts}
      </div>
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);
