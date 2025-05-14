
import { useState, useCallback } from 'react';

// Define the loading states interface with a string index signature
export interface PaymentScheduleLoadingStates extends Record<string, boolean> {
  generating: boolean;
  calculating: boolean;
  updating: boolean;
}

export function usePaymentSchedule() {
  const [loadingStates, setLoadingStates] = useState<PaymentScheduleLoadingStates>({
    generating: false,
    calculating: false,
    updating: false
  });

  const setLoading = useCallback((key: keyof PaymentScheduleLoadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);

  const setIdle = useCallback((key: keyof PaymentScheduleLoadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const wrapWithLoading = useCallback(
    <R>(key: keyof PaymentScheduleLoadingStates, fn: (...args: any[]) => Promise<R>) => {
      return async (...args: any[]): Promise<R> => {
        setLoading(key);
        try {
          const result = await fn(...args);
          return result;
        } finally {
          setIdle(key);
        }
      };
    },
    [setLoading, setIdle]
  );

  return {
    loadingStates,
    setLoading,
    setIdle,
    isAnyLoading,
    wrapWithLoading,
    isLoading: isAnyLoading // Adding isLoading for compatibility
  };
}
