
import { useState, useCallback } from 'react';

/**
 * Hook to manage the visibility of multiple dialogs
 * @param initialState Initial visibility state of dialogs
 */
export function useDialogVisibility(initialState: Record<string, boolean> = {}) {
  const [dialogs, setDialogs] = useState<Record<string, boolean>>(initialState);

  /**
   * Open a specific dialog
   */
  const openDialog = useCallback((dialogId: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogId]: true
    }));
  }, []);

  /**
   * Close a specific dialog
   */
  const closeDialog = useCallback((dialogId: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogId]: false
    }));
  }, []);

  /**
   * Toggle a specific dialog's visibility
   */
  const toggleDialog = useCallback((dialogId: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogId]: !prev[dialogId]
    }));
  }, []);

  /**
   * Check if a specific dialog is visible
   */
  const isDialogVisible = useCallback((dialogId: string): boolean => {
    return !!dialogs[dialogId];
  }, [dialogs]);

  /**
   * Close all dialogs
   */
  const closeAllDialogs = useCallback(() => {
    const closedState = Object.keys(dialogs).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    
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
