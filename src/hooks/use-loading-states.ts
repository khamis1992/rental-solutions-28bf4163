
import { useState, useCallback } from 'react';

/**
 * Custom hook to manage loading states for multiple operations
 * 
 * @param initialStates - Initial loading states object
 * @returns Object containing loading states and helper functions
 */
export function useLoadingStates(initialStates: Record<string, boolean> = {}) {
  const [states, setStates] = useState<Record<string, boolean>>(initialStates);
  
  /**
   * Set loading state for a specific operation
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
  const wrapWithLoading = useCallback(<T extends (...args: any[]) => Promise<any>>(
    key: string, 
    asyncFn: T
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      setLoading(key, true);
      try {
        return await asyncFn(...args) as ReturnType<T>;
      } finally {
        setLoading(key, false);
      }
    };
  }, [setLoading]);
  
  /**
   * Check if any operation is currently loading
   */
  const isAnyLoading = Object.values(states).some(Boolean);
  
  return { 
    loadingStates: states, 
    setLoading, 
    wrapWithLoading, 
    isAnyLoading 
  };
}
