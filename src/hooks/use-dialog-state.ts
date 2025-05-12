
import { useState } from 'react';

type DialogState = Record<string, boolean>;

export interface UseDialogStateReturn {
  dialogs: DialogState;
  isOpen: (dialogId: string) => boolean;
  open: (dialogId: string) => void;
  close: (dialogId: string) => void;
  toggle: (dialogId: string) => void;
}

/**
 * A custom hook for managing multiple dialog states with a single state object
 * @param initialState Initial dialog state configuration
 * @returns Methods to manage dialog states
 */
export function useDialogState(initialState: DialogState = {}): UseDialogStateReturn {
  const [dialogs, setDialogs] = useState<DialogState>(initialState);

  const isOpen = (dialogId: string): boolean => {
    return !!dialogs[dialogId];
  };

  const open = (dialogId: string): void => {
    setDialogs(prev => ({ ...prev, [dialogId]: true }));
  };

  const close = (dialogId: string): void => {
    setDialogs(prev => ({ ...prev, [dialogId]: false }));
  };

  const toggle = (dialogId: string): void => {
    setDialogs(prev => ({ ...prev, [dialogId]: !prev[dialogId] }));
  };

  return {
    dialogs,
    isOpen,
    open,
    close,
    toggle
  };
}
