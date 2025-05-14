
import { useState, useCallback } from 'react';

export interface PaymentGenerationLoadingStates {
  generating: boolean;
  calculating: boolean;
  scheduling: boolean;
  [key: string]: boolean; // Add index signature for Record<string, boolean> compatibility
}

export function usePaymentGenerationStates() {
  const [loadingStates, setLoadingStates] = useState<PaymentGenerationLoadingStates>({
    generating: false,
    calculating: false,
    scheduling: false
  });

  const setLoading = useCallback((key: keyof PaymentGenerationLoadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);

  const setIdle = useCallback((key: keyof PaymentGenerationLoadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const wrapWithLoading = useCallback(
    <R>(key: keyof PaymentGenerationLoadingStates, fn: (...args: any[]) => Promise<R>) => {
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
    isLoading: isAnyLoading // Explicit isLoading property
  };
}
