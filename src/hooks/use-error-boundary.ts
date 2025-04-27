
import { useCallback } from 'react';
import { logError } from '@/utils/error-tracking';

export function useErrorBoundary() {
  const throwError = useCallback((error: Error) => {
    logError(error);
    throw error;
  }, []);

  return { throwError };
}
