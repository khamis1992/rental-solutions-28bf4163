
import { useState } from "react";

interface LoadingStates {
  [key: string]: boolean;
}

export function useLoadingStates(initialStates: LoadingStates = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialStates);

  const setLoading = (key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const startLoading = (key: string) => {
    setLoading(key, true);
  };

  const stopLoading = (key: string) => {
    setLoading(key, false);
  };

  const isLoading = (key: string) => {
    return !!loadingStates[key];
  };

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading
  };
}
