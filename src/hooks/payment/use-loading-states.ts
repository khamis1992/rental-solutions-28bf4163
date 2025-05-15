
import { useState } from 'react';

export interface LoadingStates {
  loadPayments: boolean;
  createPayment: boolean;
  updatePayment: boolean;
  deletePayment: boolean;
  generatePayment: boolean;
  recurringPayment: boolean;
  processSpecialPayment: boolean;
}

export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    loadPayments: false,
    createPayment: false,
    updatePayment: false,
    deletePayment: false,
    generatePayment: false,
    recurringPayment: false,
    processSpecialPayment: false,
  });

  const setLoading = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const startLoading = (key: keyof LoadingStates) => {
    setLoading(key, true);
  };

  const stopLoading = (key: keyof LoadingStates) => {
    setLoading(key, false);
  };

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading: (key: keyof LoadingStates) => loadingStates[key]
  };
}

export default useLoadingStates;
