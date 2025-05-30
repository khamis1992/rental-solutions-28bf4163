
import { useState, useCallback } from 'react';

/**
 * Utility functions for dialog management and form state handling
 * Provides type-safe dialog state management for forms and modals
 */

export interface DialogState {
  isOpen: boolean;
  data?: any;
}

export interface FormDialogState<T = any> extends DialogState {
  data?: T;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Creates a dialog state manager with type safety
 * @param initialState Initial dialog state
 * @returns Dialog state management functions
 */
export function createDialogState<T = any>(initialState: FormDialogState<T> = { isOpen: false }) {
  return {
    state: initialState,
    open: (data?: T, mode: 'create' | 'edit' | 'view' = 'create') => ({
      isOpen: true,
      data,
      mode
    }),
    close: () => ({
      isOpen: false,
      data: undefined,
      mode: undefined
    }),
    toggle: (currentState: FormDialogState<T>) => ({
      ...currentState,
      isOpen: !currentState.isOpen
    })
  };
}

/**
 * Type-safe dialog event handlers
 */
export interface DialogHandlers<T = any> {
  onOpen: (data?: T, mode?: 'create' | 'edit' | 'view') => void;
  onClose: () => void;
  onSubmit: (data: T) => void | Promise<void>;
}

/**
 * Creates standardized dialog handlers
 * @param setState State setter function
 * @param onSubmit Submit handler
 * @returns Dialog event handlers
 */
export function createDialogHandlers<T = any>(
  setState: (state: FormDialogState<T>) => void,
  onSubmit: (data: T) => void | Promise<void>
): DialogHandlers<T> {
  return {
    onOpen: (data?: T, mode: 'create' | 'edit' | 'view' = 'create') => {
      setState({ isOpen: true, data, mode });
    },
    onClose: () => {
      setState({ isOpen: false, data: undefined, mode: undefined });
    },
    onSubmit: async (data: T) => {
      await onSubmit(data);
      setState({ isOpen: false, data: undefined, mode: undefined });
    }
  };
}

/**
 * Hook for managing multiple dialog states
 */
export function useDialogVisibility<T extends Record<string, boolean>>(initialStates: T) {
  const [dialogs, setDialogs] = useState<T>(initialStates);

  const openDialog = useCallback((dialogName: keyof T) => {
    setDialogs(prev => ({ ...prev, [dialogName]: true }));
  }, []);

  const closeDialog = useCallback((dialogName: keyof T) => {
    setDialogs(prev => ({ ...prev, [dialogName]: false }));
  }, []);

  const toggleDialog = useCallback((dialogName: keyof T) => {
    setDialogs(prev => ({ ...prev, [dialogName]: !prev[dialogName] }));
  }, []);

  const isDialogVisible = useCallback((dialogName: keyof T) => {
    return dialogs[dialogName];
  }, [dialogs]);

  return {
    dialogs,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogVisible
  };
}

/**
 * Validation helper for form data
 * @param data Form data to validate
 * @param requiredFields List of required field names
 * @returns Validation result
 */
export function validateFormData<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${String(field)} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Form state management utilities
 */
export interface FormState<T = any> {
  data: T;
  errors: Record<keyof T, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Creates form state manager
 * @param initialData Initial form data
 * @returns Form state management functions
 */
export function createFormState<T extends Record<string, any>>(initialData: T) {
  const initialState: FormState<T> = {
    data: initialData,
    errors: {} as Record<keyof T, string>,
    isSubmitting: false,
    isDirty: false
  };
  
  return {
    initialState,
    updateField: (field: keyof T, value: T[keyof T]) => (state: FormState<T>): FormState<T> => ({
      ...state,
      data: { ...state.data, [field]: value },
      isDirty: true,
      errors: { ...state.errors, [field]: '' }
    }),
    setErrors: (errors: Partial<Record<keyof T, string>>) => (state: FormState<T>): FormState<T> => ({
      ...state,
      errors: { ...state.errors, ...errors }
    }),
    setSubmitting: (isSubmitting: boolean) => (state: FormState<T>): FormState<T> => ({
      ...state,
      isSubmitting
    }),
    reset: () => initialState
  };
}
