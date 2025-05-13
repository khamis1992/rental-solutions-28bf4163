
import { useState, useCallback } from 'react';

/**
 * Hook for managing dialog visibility states
 * @param initialState Object with dialog names as keys and visibility as boolean values
 * @returns Object with dialog state and utility functions
 */
export function useDialogVisibility<T extends Record<string, boolean>>(initialState: T) {
  const [dialogs, setDialogs] = useState<T>(initialState);

  /**
   * Open a specific dialog
   */
  const openDialog = useCallback((name: keyof T) => {
    setDialogs(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  /**
   * Close a specific dialog
   */
  const closeDialog = useCallback((name: keyof T) => {
    setDialogs(prev => ({
      ...prev,
      [name]: false
    }));
  }, []);

  /**
   * Toggle a specific dialog
   */
  const toggleDialog = useCallback((name: keyof T) => {
    setDialogs(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  }, []);

  /**
   * Check if a specific dialog is visible
   */
  const isDialogVisible = useCallback((name: keyof T) => {
    return dialogs[name];
  }, [dialogs]);

  /**
   * Close all dialogs
   */
  const closeAllDialogs = useCallback(() => {
    const closedState = Object.keys(dialogs).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as T);
    
    setDialogs(closedState);
  }, [dialogs]);

  return {
    dialogs,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogVisible,
    closeAllDialogs
  };
}
