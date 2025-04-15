
import { useState, useCallback } from 'react';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
}

export const useSidebar = (): SidebarState => {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = useCallback(() => {
    setIsOpen(prevOpen => !prevOpen);
  }, []);

  return { isOpen, toggle };
};

export default useSidebar;
