
import { useState } from 'react';

/**
 * Hook for managing loading states for multiple operations
 */
export function useLoadingStates<T extends Record<string, boolean>>(initialStates: T) {
  const [loadingStates, setLoadingStates] = useState<T>(initialStates);

  /**
   * Set a specific loading state to true
   */
  const setLoading = (key: keyof T) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: true
    }));
  };

  /**
   * Set a specific loading state to false
   */
  const setIdle = (key: keyof T) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: false
    }));
  };

  /**
   * Check if any loading state is true
   */
  const isAnyLoading = Object.values(loadingStates).some(state => state === true);

  /**
   * Wrap a function with loading state management
   */
  const wrapWithLoading = <R>(key: keyof T, fn: (...args: any[]) => Promise<R>) => {
    return async (...args: any[]): Promise<R> => {
      try {
        setLoading(key);
        return await fn(...args);
      } finally {
        setIdle(key);
      }
    };
  };

  return {
    loadingStates,
    setLoading,
    setIdle,
    isAnyLoading,
    wrapWithLoading
  };
}
