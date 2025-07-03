import { useState, useCallback } from 'react';
import { handleError as handleApiError } from '@/lib/errors/error-handler';
import { AppError, ErrorSeverity } from '@/types/error.types';
import { toast } from '@/hooks/use-toast';

export interface ErrorState {
  error: AppError | null;
  isError: boolean;
  hasError: boolean;
  errorMessage: string | null;
  severity: ErrorSeverity;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customHandler?: (error: AppError) => void;
  context?: Record<string, any>;
}

export interface UseErrorHandlerReturn {
  error: ErrorState;
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
  retry: (() => void) | null;
  setRetryHandler: (handler: () => void) => void;
}

const initialErrorState: ErrorState = {
  error: null,
  isError: false,
  hasError: false,
  errorMessage: null,
  severity: 'low'
};

/**
 * Hook موحد لمعالجة الأخطاء في جميع المكونات
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>(initialErrorState);
  const [retryHandler, setRetryHandler] = useState<(() => void) | null>(null);

  const handleError = useCallback(async (
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customHandler,
      context = {}
    } = options;

    try {
      // استخدام نظام معالجة الأخطاء المركزي
      const response = await handleApiError(error, {
        showToast,
        logError,
        context
      });

      if (!response.success && response.error) {
        const appError = response.error;
        
        // تحديث حالة الخطأ
        setErrorState({
          error: appError,
          isError: true,
          hasError: true,
          errorMessage: appError.message,
          severity: appError.severity || 'medium'
        });

        // تشغيل المعالج المخصص إذا كان موجوداً
        if (customHandler) {
          customHandler(appError);
        }
      }
    } catch (handlerError) {
      // في حالة فشل معالج الأخطاء نفسه
      console.error('Error in error handler:', handlerError);
      
      const fallbackError: AppError = {
        code: 'SERVICE_ERROR',
        message: 'خطأ في معالج الأخطاء',
        severity: 'high',
        retryable: false,
        details: { originalError: String(error) }
      };

      setErrorState({
        error: fallbackError,
        isError: true,
        hasError: true,
        errorMessage: fallbackError.message,
        severity: 'high'
      });

      if (showToast) {
        toast({
          title: 'خطأ غير متوقع',
          description: 'حدث خطأ في معالج الأخطاء',
          variant: 'destructive'
        });
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(initialErrorState);
    setRetryHandler(null);
  }, []);

  const setRetryHandlerCallback = useCallback((handler: () => void) => {
    setRetryHandler(() => handler);
  }, []);

  return {
    error: errorState,
    handleError,
    clearError,
    retry: retryHandler,
    setRetryHandler: setRetryHandlerCallback
  };
}

/**
 * Hook مخصص لمعالجة أخطاء العمليات غير المتزامنة
 */
export function useAsyncErrorHandler() {
  const { handleError, ...rest } = useErrorHandler();

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    ...rest,
    executeAsync,
    handleError
  };
}

/**
 * Hook لمعالجة أخطاء النماذج
 */
export function useFormErrorHandler() {
  const { handleError, ...rest } = useErrorHandler();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleFormError = useCallback((error: unknown, options?: ErrorHandlerOptions) => {
    // معالجة أخطاء التحقق من النماذج
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as any;
      const newFieldErrors: Record<string, string[]> = {};
      
      zodError.issues?.forEach((issue: any) => {
        const field = issue.path?.join('.') || 'form';
        if (!newFieldErrors[field]) {
          newFieldErrors[field] = [];
        }
        newFieldErrors[field].push(issue.message);
      });
      
      setFieldErrors(newFieldErrors);
    } else {
      // معالجة الأخطاء العامة
      handleError(error, options);
    }
  }, [handleError]);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName]?.[0] || null;
  }, [fieldErrors]);

  return {
    ...rest,
    handleFormError,
    fieldErrors,
    clearFieldErrors,
    getFieldError
  };
} 