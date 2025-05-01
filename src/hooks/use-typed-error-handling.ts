
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  ApiError,
  DatabaseError,
  ValidationError,
  getErrorMessage 
} from '@/utils/error-handling';
import { 
  handleTypedError,
  categorizeError,
  withErrorHandling
} from '@/utils/type-safe-errors';

interface ErrorHandlingOptions {
  showToast?: boolean;
  captureErrors?: boolean;
  rethrow?: boolean;
}

interface ErrorState {
  hasError: boolean;
  apiErrors: ApiError[];
  dbErrors: DatabaseError[];
  validationErrors: ValidationError[];
  otherErrors: Error[];
}

export function useTypedErrorHandling(defaultOptions: ErrorHandlingOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    apiErrors: [],
    dbErrors: [],
    validationErrors: [],
    otherErrors: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const clearErrors = useCallback(() => {
    setErrorState({
      hasError: false,
      apiErrors: [],
      dbErrors: [],
      validationErrors: [],
      otherErrors: []
    });
  }, []);
  
  const handleError = useCallback((error: unknown, options: ErrorHandlingOptions = {}) => {
    const { showToast = true } = { ...defaultOptions, ...options };
    const result = categorizeError(error);
    
    // Update error state with typed errors
    setErrorState(prev => {
      switch (result.type) {
        case 'api':
          return {
            ...prev,
            hasError: true,
            apiErrors: [...prev.apiErrors, result.error],
          };
        case 'database':
          return {
            ...prev,
            hasError: true,
            dbErrors: [...prev.dbErrors, result.error],
          };
        case 'validation':
          return {
            ...prev,
            hasError: true,
            validationErrors: [...prev.validationErrors, result.error],
          };
        case 'unknown':
          return {
            ...prev,
            hasError: true,
            otherErrors: [...prev.otherErrors, result.error instanceof Error ? result.error : new Error(result.error.message)],
          };
      }
    });
    
    // Show toast based on error type with different styling/messaging
    if (showToast) {
      handleTypedError(error, {
        onApiError: (apiError) => {
          toast({
            title: `API Error (${apiError.statusCode || 'unknown'})`,
            description: apiError.message,
            variant: 'destructive',
          });
        },
        onDatabaseError: (dbError) => {
          toast({
            title: `Database Error (${dbError.operation || 'unknown'})`,
            description: dbError.message,
            variant: 'destructive',
          });
        },
        onValidationError: (valError) => {
          toast({
            title: 'Validation Error',
            description: valError.field ? `${valError.field}: ${valError.message}` : valError.message,
            variant: 'default',
            className: 'bg-yellow-50 border-yellow-200',
          });
        },
        onUnknownError: (unknownError) => {
          toast({
            title: 'Error',
            description: getErrorMessage(unknownError),
            variant: 'destructive',
          });
        },
        fallback: () => {
          toast({
            title: 'Error',
            description: 'An unknown error occurred',
            variant: 'destructive',
          });
        }
      });
    }
  }, [defaultOptions, toast]);
  
  const runWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ): Promise<T | null> => {
    const { showToast = true, captureErrors = true, rethrow = false } = { ...defaultOptions, ...options };
    
    if (captureErrors) {
      clearErrors();
    }
    
    setIsLoading(true);
    
    try {
      const result = await operation();
      setIsLoading(false);
      return result;
    } catch (error) {
      if (captureErrors) {
        handleError(error, { showToast });
      }
      setIsLoading(false);
      
      if (rethrow) {
        throw error;
      }
      
      return null;
    }
  }, [defaultOptions, clearErrors, handleError]);

  return {
    errorState,
    isLoading,
    clearErrors,
    handleError,
    runWithErrorHandling,
    withTypedHandling: withErrorHandling
  };
}
