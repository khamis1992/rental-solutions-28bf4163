
import { useState, useCallback } from 'react';

/**
 * Hook for managing various loading states
 */
export const useLoadingStates = <T extends Record<string, boolean>>(initialStates: T) => {
  const [loadingStates, setLoadingStates] = useState<T>(initialStates);

  /**
   * Set a specific loading state
   */
  const setLoading = useCallback((key: keyof T, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  /**
   * Check if any loading state is true
   */
  const isAnyLoading = Object.values(loadingStates).some(state => state === true);

  /**
   * Reset all loading states to false
   */
  const resetLoadingStates = useCallback(() => {
    const resetState = Object.keys(loadingStates).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as T);
    
    setLoadingStates(resetState);
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
    resetLoadingStates
  };
};
