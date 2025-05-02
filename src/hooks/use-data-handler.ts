
import { useState } from 'react';
import { ServiceResponse } from '@/utils/response-handler';

interface DataHandlerOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onSettled?: () => void;
}

export function useDataHandler(options: DataHandlerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    onSuccess,
    onError,
    onSettled
  } = options;

  const handleOperation = async <T>(operation: () => Promise<ServiceResponse<T>>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      
      if (result.success) {
        if (showSuccessToast) {
          // toast.success(successMessage);
          console.log(successMessage);
        }
        
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        return result;
      } else {
        const errorObj = new Error(result.message || errorMessage);
        setError(errorObj);
        
        if (showErrorToast) {
          // toast.error(result.message || errorMessage);
          console.error(result.message || errorMessage);
        }
        
        if (onError) {
          onError(errorObj);
        }
        
        return result;
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      
      if (showErrorToast) {
        // toast.error(errorObj.message || errorMessage);
        console.error(errorObj.message || errorMessage);
      }
      
      if (onError) {
        onError(errorObj);
      }
      
      return {
        success: false,
        error: errorObj,
        message: errorObj.message,
        statusCode: 500
      } as ServiceResponse<T>;
    } finally {
      setIsLoading(false);
      
      if (onSettled) {
        onSettled();
      }
    }
  };

  return {
    isLoading,
    error,
    handleOperation
  };
}
