import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';

// ===============================
// Types & Interfaces
// ===============================

interface AppState {
  // Global UI State
  sidebar: {
    isOpen: boolean;
    isCollapsed: boolean;
  };
  
  // Modal/Dialog State
  modals: {
    [key: string]: boolean;
  };
  
  // Notification State
  notifications: {
    count: number;
    items: Notification[];
  };
  
  // Loading States
  loading: {
    [key: string]: boolean;
  };
  
  // Filter States
  filters: {
    [key: string]: any;
  };
  
  // Selection States
  selections: {
    [key: string]: string[] | string;
  };
  
  // Cache
  cache: {
    [key: string]: any;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

type AppAction = 
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'TOGGLE_MODAL'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'CLEAR_FILTER'; payload: string }
  | { type: 'SET_SELECTION'; payload: { key: string; value: string[] | string } }
  | { type: 'CLEAR_SELECTION'; payload: string }
  | { type: 'SET_CACHE'; payload: { key: string; value: any } }
  | { type: 'CLEAR_CACHE'; payload: string }
  | { type: 'RESET_STATE' };

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading actions
  setLoading: (key: string, value: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Filter actions
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  getFilter: (key: string) => any;
  
  // Selection actions
  setSelection: (key: string, value: string[] | string) => void;
  clearSelection: (key: string) => void;
  getSelection: (key: string) => string[] | string;
  
  // Cache actions
  setCache: (key: string, value: any) => void;
  clearCache: (key: string) => void;
  getCache: (key: string) => any;
  
  // Reset
  resetState: () => void;
}

// ===============================
// Initial State
// ===============================

const initialState: AppState = {
  sidebar: {
    isOpen: true,
    isCollapsed: false,
  },
  modals: {},
  notifications: {
    count: 0,
    items: [],
  },
  loading: {},
  filters: {},
  selections: {},
  cache: {},
};

// ===============================
// Reducer
// ===============================

const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebar: {
          ...state.sidebar,
          isOpen: !state.sidebar.isOpen,
        },
      };
      
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebar: {
          ...state.sidebar,
          isOpen: action.payload,
        },
      };
      
    case 'SET_SIDEBAR_COLLAPSED':
      return {
        ...state,
        sidebar: {
          ...state.sidebar,
          isCollapsed: action.payload,
        },
      };
      
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: true,
        },
      };
      
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: false,
        },
      };
      
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: !state.modals[action.payload],
        },
      };
      
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        isRead: false,
      };
      
      return {
        ...state,
        notifications: {
          count: state.notifications.count + 1,
          items: [newNotification, ...state.notifications.items],
        },
      };
      
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: {
          count: Math.max(0, state.notifications.count - 1),
          items: state.notifications.items.filter(n => n.id !== action.payload),
        },
      };
      
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(n => 
            n.id === action.payload ? { ...n, isRead: true } : n
          ),
        },
      };
      
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: {
          count: 0,
          items: [],
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'CLEAR_FILTER':
      const { [action.payload]: _, ...remainingFilters } = state.filters;
      return {
        ...state,
        filters: remainingFilters,
      };
      
    case 'SET_SELECTION':
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'CLEAR_SELECTION':
      const { [action.payload]: __, ...remainingSelections } = state.selections;
      return {
        ...state,
        selections: remainingSelections,
      };
      
    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'CLEAR_CACHE':
      const { [action.payload]: ___, ...remainingCache } = state.cache;
      return {
        ...state,
        cache: remainingCache,
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
};

// ===============================
// Context
// ===============================

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

// ===============================
// Provider Component
// ===============================

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // Sidebar actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);
  
  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, []);
  
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed });
  }, []);
  
  // Modal actions
  const openModal = useCallback((modalId: string) => {
    dispatch({ type: 'OPEN_MODAL', payload: modalId });
  }, []);
  
  const closeModal = useCallback((modalId: string) => {
    dispatch({ type: 'CLOSE_MODAL', payload: modalId });
  }, []);
  
  const toggleModal = useCallback((modalId: string) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modalId });
  }, []);
  
  const isModalOpen = useCallback((modalId: string) => {
    return !!state.modals[modalId];
  }, [state.modals]);
  
  // Notification actions
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);
  
  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  }, []);
  
  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);
  
  // Loading actions
  const setLoading = useCallback((key: string, value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);
  
  const isLoading = useCallback((key: string) => {
    return !!state.loading[key];
  }, [state.loading]);
  
  // Filter actions
  const setFilter = useCallback((key: string, value: any) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  }, []);
  
  const clearFilter = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_FILTER', payload: key });
  }, []);
  
  const getFilter = useCallback((key: string) => {
    return state.filters[key];
  }, [state.filters]);
  
  // Selection actions
  const setSelection = useCallback((key: string, value: string[] | string) => {
    dispatch({ type: 'SET_SELECTION', payload: { key, value } });
  }, []);
  
  const clearSelection = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_SELECTION', payload: key });
  }, []);
  
  const getSelection = useCallback((key: string) => {
    return state.selections[key];
  }, [state.selections]);
  
  // Cache actions
  const setCache = useCallback((key: string, value: any) => {
    dispatch({ type: 'SET_CACHE', payload: { key, value } });
  }, []);
  
  const clearCache = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_CACHE', payload: key });
  }, []);
  
  const getCache = useCallback((key: string) => {
    return state.cache[key];
  }, [state.cache]);
  
  // Reset
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);
  
  const value: AppStateContextValue = {
    state,
    dispatch,
    
    // Sidebar
    toggleSidebar,
    setSidebarOpen,
    setSidebarCollapsed,
    
    // Modals
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    
    // Notifications
    addNotification,
    removeNotification,
    markNotificationRead,
    clearNotifications,
    
    // Loading
    setLoading,
    isLoading,
    
    // Filters
    setFilter,
    clearFilter,
    getFilter,
    
    // Selections
    setSelection,
    clearSelection,
    getSelection,
    
    // Cache
    setCache,
    clearCache,
    getCache,
    
    // Reset
    resetState,
  };
  
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// ===============================
// Hook
// ===============================

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// ===============================
// Specialized Hooks
// ===============================

// Sidebar Hook
export const useSidebar = () => {
  const { state, toggleSidebar, setSidebarOpen, setSidebarCollapsed } = useAppState();
  
  return {
    isOpen: state.sidebar.isOpen,
    isCollapsed: state.sidebar.isCollapsed,
    toggle: toggleSidebar,
    setOpen: setSidebarOpen,
    setCollapsed: setSidebarCollapsed,
  };
};

// Modal Hook
export const useModal = (modalId: string) => {
  const { openModal, closeModal, toggleModal, isModalOpen } = useAppState();
  
  return {
    isOpen: isModalOpen(modalId),
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => toggleModal(modalId),
  };
};

// Notification Hook
export const useNotifications = () => {
  const { state, addNotification, removeNotification, markNotificationRead, clearNotifications } = useAppState();
  
  return {
    notifications: state.notifications.items,
    count: state.notifications.count,
    unreadCount: state.notifications.items.filter(n => !n.isRead).length,
    add: addNotification,
    remove: removeNotification,
    markRead: markNotificationRead,
    clear: clearNotifications,
  };
};

// Loading Hook
export const useLoadingState = (key: string) => {
  const { setLoading, isLoading } = useAppState();
  
  return {
    isLoading: isLoading(key),
    setLoading: (value: boolean) => setLoading(key, value),
  };
};

// Filter Hook
export const useFilter = (key: string) => {
  const { setFilter, clearFilter, getFilter } = useAppState();
  
  return {
    filter: getFilter(key),
    setFilter: (value: any) => setFilter(key, value),
    clearFilter: () => clearFilter(key),
  };
};

// Selection Hook
export const useSelection = (key: string) => {
  const { setSelection, clearSelection, getSelection } = useAppState();
  
  return {
    selection: getSelection(key),
    setSelection: (value: string[] | string) => setSelection(key, value),
    clearSelection: () => clearSelection(key),
  };
};

// Cache Hook
export const useCache = (key: string) => {
  const { setCache, clearCache, getCache } = useAppState();
  
  return {
    cache: getCache(key),
    setCache: (value: any) => setCache(key, value),
    clearCache: () => clearCache(key),
  };
};

// Export types
export type { AppState, AppAction, Notification, AppStateContextValue }; 