
import React from 'react';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
}

export const useSidebar = (): SidebarState => {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggle = React.useCallback(() => {
    setIsOpen(prevOpen => !prevOpen);
  }, []);

  return { isOpen, toggle };
};
