
import { useState } from 'react';

export type LoadingState<T extends Record<string, boolean>> = {
  [K in keyof T]: boolean;
};

export interface StatusHandlers<T extends Record<string, boolean>> {
  setLoading: (key: keyof T) => void;
  setIdle: (key: keyof T) => void;
  isLoading: (key: keyof T) => boolean;
  resetAll: () => void;
}

export const useLoadingStates = <T extends Record<string, boolean>>(initialState: T): [T, StatusHandlers<T>] => {
  const [state, setState] = useState<T>(initialState);

  const setLoading = (key: keyof T) => {
    setState(prev => ({ ...prev, [key]: true }));
  };

  const setIdle = (key: keyof T) => {
    setState(prev => ({ ...prev, [key]: false }));
  };

  const isLoading = (key: keyof T): boolean => {
    return !!state[key];
  };

  const resetAll = () => {
    const resetState = Object.keys(initialState).reduce((acc, key) => {
      acc[key as keyof T] = false as T[keyof T];
      return acc;
    }, {} as T);
    setState(resetState);
  };

  const handlers: StatusHandlers<T> = {
    setLoading,
    setIdle,
    isLoading,
    resetAll
  };

  return [state, handlers];
};
