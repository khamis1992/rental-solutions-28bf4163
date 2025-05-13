
import { useState, useCallback } from 'react';

interface StatusHandlers<T extends Record<string, boolean>> {
  setLoading: <K extends keyof T>(status: K) => void;
  setIdle: <K extends keyof T>(status: K) => void;
  isLoading: <K extends keyof T>(status: K) => boolean;
  isAnyLoading: () => boolean;
}

/**
 * Hook to manage multiple loading states
 */
export function useLoadingStates<T extends Record<string, boolean>>(initialStates: T): {
  loadingStates: T;
  setLoading: <K extends keyof T>(status: K) => void;
  setIdle: <K extends keyof T>(status: K) => void;
  isLoading: <K extends keyof T>(status: K) => boolean;
  isAnyLoading: () => boolean;
} {
  const [loadingStates, setLoadingStates] = useState<T>(initialStates);
  
  const setLoading = useCallback(<K extends keyof T>(status: K) => {
    setLoadingStates(prev => ({
      ...prev,
      [status]: true
    }));
  }, []);
  
  const setIdle = useCallback(<K extends keyof T>(status: K) => {
    setLoadingStates(prev => ({
      ...prev,
      [status]: false
    }));
  }, []);
  
  const isLoading = useCallback(<K extends keyof T>(status: K): boolean => {
    return !!loadingStates[status];
  }, [loadingStates]);
  
  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => !!state);
  }, [loadingStates]);
  
  return {
    loadingStates,
    setLoading,
    setIdle,
    isLoading,
    isAnyLoading
  };
}
