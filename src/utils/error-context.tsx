
import React, { createContext, useContext } from 'react';
import { useErrorStore, ErrorEvent } from '@/store/useErrorStore';

interface ErrorContextType {
  addError: (error: Omit<ErrorEvent, 'id' | 'timestamp'>) => void;
  markErrorAsHandled: (id: string) => void;
  clearErrors: () => void;
  lastError: ErrorEvent | null;
}

// Create context with default values
const ErrorContext = createContext<ErrorContextType>({
  addError: () => {},
  markErrorAsHandled: () => {},
  clearErrors: () => {},
  lastError: null
});

// Provider component
export const ErrorContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addError, markErrorAsHandled, clearErrors, lastError } = useErrorStore();
  
  return (
    <ErrorContext.Provider value={{ addError, markErrorAsHandled, clearErrors, lastError }}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook for functional components
export const useErrorContext = () => useContext(ErrorContext);

// HOC for class components
export function withErrorContext<P extends object>(
  Component: React.ComponentType<P & { errorContext: ErrorContextType }>
) {
  return function WithErrorContext(props: P) {
    const errorContext = useErrorContext();
    return <Component {...props} errorContext={errorContext} />;
  };
}
