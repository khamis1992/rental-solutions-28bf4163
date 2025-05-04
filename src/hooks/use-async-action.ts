
import { useState, useCallback } from 'react';

interface AsyncActionOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const useAsyncAction = <T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  deps: any[] = [],
  options: AsyncActionOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null);

  const execute = useCallback(async (...args: Parameters<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn(...args);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, deps);

  return {
    execute,
    loading,
    error,
    data,
  };
};
