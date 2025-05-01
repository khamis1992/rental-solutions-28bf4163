
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// Define error severity levels
export type ErrorSeverity = 'error' | 'warning' | 'info';

// Define error categories
export type ErrorCategory = 
  | 'api'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'database'
  | 'rendering'
  | 'business'
  | 'unknown';

// Define the error structure
export interface ErrorData {
  id: string;
  message: string;
  details?: string;
  code?: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category?: ErrorCategory;
  source?: string;
  handled: boolean;
  meta?: Record<string, any>;
}

// Define the context interface
interface ErrorContextType {
  errors: ErrorData[];
  addError: (error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
  markErrorAsHandled: (id: string) => void;
  getLastError: () => ErrorData | undefined;
}

// Create the context with default values
const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  addError: () => '',
  removeError: () => {},
  clearErrors: () => {},
  markErrorAsHandled: () => {},
  getLastError: () => undefined,
});

// Generate a unique ID for each error
const generateErrorId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Props type for the ErrorProvider component
type ErrorProviderProps = {
  children: ReactNode | ((contextValue: ErrorContextType) => ReactNode);
};

// Create the provider component
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorData[]>([]);

  // Add a new error to the errors array
  const addError = useCallback((error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => {
    const newError: ErrorData = {
      ...error,
      id: generateErrorId(),
      timestamp: new Date(),
      handled: false,
    };
    
    setErrors((prevErrors) => [...prevErrors, newError]);
    
    // Display toast based on severity
    const toastOptions = { duration: error.severity === 'error' ? 6000 : 4000 };
    
    let icon;
    switch (error.severity) {
      case 'error':
        icon = <XCircle className="h-4 w-4 text-destructive" />;
        toast({
          title: error.code ? `Error ${error.code}` : 'Error',
          description: error.message,
          variant: 'destructive',
          ...toastOptions,
        });
        break;
      case 'warning':
        icon = <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        toast({
          title: 'Warning',
          description: error.message,
          variant: 'default',
          className: 'bg-yellow-50 border-yellow-200',
          ...toastOptions,
        });
        break;
      case 'info':
        icon = <Info className="h-4 w-4 text-blue-500" />;
        toast({
          title: 'Information',
          description: error.message,
          ...toastOptions,
        });
        break;
    }
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${error.severity.toUpperCase()}]`, error);
    }
    
    return newError.id;
  }, []);

  // Remove an error by ID
  const removeError = useCallback((id: string) => {
    setErrors((prevErrors) => prevErrors.filter((error) => error.id !== id));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Mark an error as handled
  const markErrorAsHandled = useCallback((id: string) => {
    setErrors((prevErrors) =>
      prevErrors.map((error) =>
        error.id === id ? { ...error, handled: true } : error
      )
    );
  }, []);

  // Get the most recent error
  const getLastError = useCallback(() => {
    return errors[errors.length - 1];
  }, [errors]);

  // Create the context value
  const contextValue: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    markErrorAsHandled,
    getLastError,
  };

  // Support render props pattern
  return (
    <ErrorContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
