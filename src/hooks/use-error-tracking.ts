
import { useCallback } from 'react';
import { useErrorStore, ErrorEvent } from '@/store/useErrorStore';
import { logError } from '@/utils/error-tracking';
import { toast } from 'sonner';

export function useErrorTracking() {
  const { errors, lastError, addError, markErrorAsHandled, clearErrors } = useErrorStore();

  const trackError = useCallback((
    error: Error | string,
    context?: Record<string, any>,
    componentName?: string,
    severity: 'error' | 'warning' | 'info' = 'error'
  ) => {
    logError(error, context, componentName, severity);
  }, []);

  const withErrorHandling = useCallback(<T>(
    fn: (...args: any[]) => Promise<T>,
    componentName?: string,
    context?: Record<string, any>
  ) => {
    return async (...args: any[]): Promise<[T | null, Error | null]> => {
      try {
        const result = await fn(...args);
        return [result, null];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        trackError(err, { ...context, args }, componentName);
        toast.error(err.message);
        return [null, err];
      }
    };
  }, []);

  return {
    errors,
    lastError,
    addError,
    markErrorAsHandled,
    clearErrors,
    trackError,
    withErrorHandling
  };
}
