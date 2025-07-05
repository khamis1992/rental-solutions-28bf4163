
import React, { createContext, useContext, ReactNode } from 'react';
import { useDialogState, UseDialogStateReturn } from './use-dialog-state';

// Create context
const DialogContext = createContext<UseDialogStateReturn | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
  initialDialogs?: Record<string, boolean>;
}

export function DialogProvider({ children, initialDialogs = {} }: DialogProviderProps) {
  const dialogMethods = useDialogState(initialDialogs);
  
  return (
    <DialogContext.Provider value={dialogMethods}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialogs(): UseDialogStateReturn {
  const context = useContext(DialogContext);
  
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  
  return context;
}
