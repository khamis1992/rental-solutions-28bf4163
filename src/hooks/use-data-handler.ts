
import { useState, useCallback } from 'react';
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';
import { toast } from '@/hooks/use-toast';

interface UseDataHandlerOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useDataHandler<T = any>(options: UseDataHandlerOptions<T> = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully'
  } = options;

  const handleOperation = useCallback(
    async <R = T>(
      operation: () => Promise<ServiceResponse<R>>,
      customOptions?: {
        successMessage?: string;
        errorMessage?: string;
        showToast?: boolean;
      }
    ): Promise<ServiceResponse<R>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await operation();

        if (response.success && response.data) {
          setData(response.data as unknown as T);
          
          if (onSuccess) {
            onSuccess(response.data as unknown as T);
          }

          if (showSuccessToast && customOptions?.showToast !== false) {
            toast({
              title: 'Success',
              description: customOptions?.successMessage || successMessage
            });
          }
          
          setIsLoading(false);
          return response;
        } else {
          const errorMsg = response.message || 'An unknown error occurred';
          
          setError(new Error(errorMsg));
          
          if (onError) {
            onError(response.error || new Error(errorMsg));
          }

          if (showErrorToast && customOptions?.showToast !== false) {
            toast({
              title: 'Error',
              description: customOptions?.errorMessage || errorMsg,
              variant: 'destructive'
            });
          }
          
          setIsLoading(false);
          return response;
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        
        setError(error);
        
        if (onError) {
          onError(error);
        }

        if (showErrorToast && customOptions?.showToast !== false) {
          toast({
            title: 'Error',
            description: customOptions?.errorMessage || error.message,
            variant: 'destructive'
          });
        }
        
        setIsLoading(false);
        return errorResponse(error);
      }
    },
    [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]
  );

  return {
    handleOperation,
    isLoading,
    error,
    data,
    setData
  };
}
