
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing multiple loading states in a single object.
 * 
 * @param initialStates - Initial loading states object
 * @returns Loading states management utilities
 */
export function useLoadingStates(initialStates: Record<string, boolean> = {}) {
  const [states, setStates] = useState<Record<string, boolean>>(initialStates);
  
  /**
   * Set the loading state for a specific operation
   */
  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);
  
  /**
   * Wrap an async function with loading state management
   */
  const wrapWithLoading = useCallback(<T extends any[], R>(
    key: string, 
    asyncFn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      setLoading(key, true);
      try {
        return await asyncFn(...args);
      } finally {
        setLoading(key, false);
      }
    };
  }, [setLoading]);

  /**
   * Check if any loading state is active
   */
  const isAnyLoading = Object.values(states).some(Boolean);
  
  return { 
    loadingStates: states, 
    setLoading, 
    wrapWithLoading, 
    isAnyLoading 
  };
}
