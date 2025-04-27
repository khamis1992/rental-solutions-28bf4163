
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  componentName?: string;
  context?: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
  handled: boolean;
  userInfo?: {
    id?: string;
    email?: string;
  };
}

interface ErrorState {
  errors: ErrorEvent[];
  lastError: ErrorEvent | null;
  addError: (error: Omit<ErrorEvent, 'id' | 'timestamp'>) => void;
  markErrorAsHandled: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>()(
  devtools(
    persist(
      (set) => ({
        errors: [],
        lastError: null,
        addError: (errorData) => {
          const newError: ErrorEvent = {
            ...errorData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          };

          set((state) => ({
            errors: [newError, ...state.errors].slice(0, 100), // Only keep last 100 errors
            lastError: newError,
          }));
        },
        markErrorAsHandled: (id) => {
          set((state) => ({
            errors: state.errors.map((error) =>
              error.id === id ? { ...error, handled: true } : error
            ),
          }));
        },
        clearErrors: () => {
          set({ errors: [], lastError: null });
        },
      }),
      { name: 'error-storage' }
    )
  )
);
