
import { useState, useCallback } from 'react';

/**
 * Custom hook to manage visibility state for multiple dialogs
 * 
 * @param initialState - Initial visibility state for dialogs
 * @returns Object containing dialog visibility and control functions
 */
export function useDialogVisibility(initialState: Record<string, boolean> = {}) {
  const [dialogs, setDialogs] = useState<Record<string, boolean>>(initialState);
  
  /**
   * Open a specific dialog
   */
  const openDialog = useCallback((dialogKey: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogKey]: true
    }));
  }, []);
  
  /**
   * Close a specific dialog
   */
  const closeDialog = useCallback((dialogKey: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogKey]: false
    }));
  }, []);
  
  /**
   * Toggle a specific dialog
   */
  const toggleDialog = useCallback((dialogKey: string) => {
    setDialogs(prev => ({
      ...prev,
      [dialogKey]: !prev[dialogKey]
    }));
  }, []);
  
  /**
   * Check if a specific dialog is visible
   */
  const isDialogVisible = useCallback((dialogKey: string): boolean => {
    return !!dialogs[dialogKey];
  }, [dialogs]);
  
  return {
    dialogs,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogVisible
  };
}
