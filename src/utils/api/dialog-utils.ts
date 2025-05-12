
import { useState } from 'react';

/**
 * A utility hook for managing dialog visibility state within a component
 * @param dialogs An object with dialog names as keys and their initial state as values
 * @returns A utility object with methods to manage dialog visibility
 */
export function useDialogVisibility<T extends Record<string, boolean>>(initialDialogs: T) {
  const [visibleDialogs, setVisibleDialogs] = useState<T>(initialDialogs);
  
  /**
   * Opens a specific dialog
   * @param dialogName The name of the dialog to open
   */
  const openDialog = <K extends keyof T>(dialogName: K) => {
    setVisibleDialogs(prev => ({ ...prev, [dialogName]: true } as T));
  };
  
  /**
   * Closes a specific dialog
   * @param dialogName The name of the dialog to close
   */
  const closeDialog = <K extends keyof T>(dialogName: K) => {
    setVisibleDialogs(prev => ({ ...prev, [dialogName]: false } as T));
  };
  
  /**
   * Toggles a specific dialog's visibility
   * @param dialogName The name of the dialog to toggle
   */
  const toggleDialog = <K extends keyof T>(dialogName: K) => {
    setVisibleDialogs(prev => ({ ...prev, [dialogName]: !prev[dialogName] } as T));
  };
  
  /**
   * Checks if a specific dialog is visible
   * @param dialogName The name of the dialog to check
   * @returns True if the dialog is visible, false otherwise
   */
  const isDialogVisible = <K extends keyof T>(dialogName: K): boolean => {
    return visibleDialogs[dialogName];
  };

  return {
    dialogs: visibleDialogs,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogVisible
  };
}
