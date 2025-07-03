import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEventEmitter, useEventListener, EVENTS } from '@/utils/component-communication';

// ===============================
// Types & Interfaces
// ===============================

interface GlobalState {
  // UI State
  sidebar: {
    isOpen: boolean;
    isCollapsed: boolean;
  };
  
  // Modal State
  modals: Record<string, boolean>;
  
  // Loading States
  loading: Record<string, boolean>;
  
  // Filter States
  filters: Record<string, any>;
  
  // Selection States
  selections: Record<string, any>;
  
  // Notification State
  notifications: {
    count: number;
    items: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      title: string;
      message: string;
      timestamp: Date;
      isRead: boolean;
    }>;
  };
  
  // Cache
  cache: Record<string, any>;
  
  // User Preferences
  preferences: {
    language: 'ar' | 'en';
    theme: 'light' | 'dark';
    rtl: boolean;
  };
}

type StateUpdate<T> = T | ((prevState: T) => T);

// ===============================
// Global State Store
// ===============================

class GlobalStateStore {
  private state: GlobalState;
  private subscribers: Set<(state: GlobalState) => void> = new Set();
  private persistKeys: Set<string> = new Set();
  
  constructor() {
    this.state = this.getInitialState();
    this.loadPersistedState();
  }
  
  private getInitialState(): GlobalState {
    return {
      sidebar: {
        isOpen: true,
        isCollapsed: false,
      },
      modals: {},
      loading: {},
      filters: {},
      selections: {},
      notifications: {
        count: 0,
        items: [],
      },
      cache: {},
      preferences: {
        language: 'ar',
        theme: 'light',
        rtl: true,
      },
    };
  }
  
  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem('global_state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        
        // Merge with current state to preserve structure
        this.state = {
          ...this.state,
          ...parsedState,
          // Ensure notification items are properly converted
          notifications: {
            ...this.state.notifications,
            ...parsedState.notifications,
            items: (parsedState.notifications?.items || []).map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            })),
          },
        };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }
  
  private persistState(): void {
    try {
      const stateToPersist = {
        ...this.state,
        // Don't persist temporary states
        loading: {},
        modals: {},
      };
      
      localStorage.setItem('global_state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }
  
  getState(): GlobalState {
    return this.state;
  }
  
  setState<K extends keyof GlobalState>(
    key: K,
    update: StateUpdate<GlobalState[K]>
  ): void {
    const newValue = typeof update === 'function' 
      ? (update as (prev: GlobalState[K]) => GlobalState[K])(this.state[key])
      : update;
    
    this.state = {
      ...this.state,
      [key]: newValue,
    };
    
    // Notify subscribers
    this.notifySubscribers();
    
    // Persist if needed
    if (this.persistKeys.has(key)) {
      this.persistState();
    }
  }
  
  updateNestedState<K extends keyof GlobalState>(
    key: K,
    nestedKey: string,
    value: any
  ): void {
    this.setState(key, (prev: any) => ({
      ...prev,
      [nestedKey]: value,
    }));
  }
  
  subscribe(callback: (state: GlobalState) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }
  
  enablePersistence(keys: (keyof GlobalState)[]): void {
    keys.forEach(key => this.persistKeys.add(key));
  }
  
  clearCache(): void {
    this.setState('cache', {});
  }
  
  reset(): void {
    this.state = this.getInitialState();
    this.notifySubscribers();
    localStorage.removeItem('global_state');
  }
}

// Global store instance
const globalStore = new GlobalStateStore();

// Enable persistence for certain keys
globalStore.enablePersistence(['preferences', 'notifications']);

// ===============================
// Main Hook
// ===============================

export const useGlobalState = () => {
  const [state, setState] = useState<GlobalState>(globalStore.getState());
  const emit = useEventEmitter();
  
  useEffect(() => {
    return globalStore.subscribe(setState);
  }, []);
  
  const updateState = useCallback(<K extends keyof GlobalState>(
    key: K,
    update: StateUpdate<GlobalState[K]>
  ) => {
    globalStore.setState(key, update);
    
    // Emit event for other components
    emit(EVENTS.DATA_UPDATED, { key, value: globalStore.getState()[key] });
  }, [emit]);
  
  const updateNestedState = useCallback(<K extends keyof GlobalState>(
    key: K,
    nestedKey: string,
    value: any
  ) => {
    globalStore.updateNestedState(key, nestedKey, value);
    
    // Emit event for other components
    emit(EVENTS.DATA_UPDATED, { key, nestedKey, value });
  }, [emit]);
  
  return {
    state,
    updateState,
    updateNestedState,
    clearCache: globalStore.clearCache.bind(globalStore),
    reset: globalStore.reset.bind(globalStore),
  };
};

// ===============================
// Specialized Hooks
// ===============================

/**
 * Hook for sidebar state management
 */
export const useSidebarState = () => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const toggle = useCallback(() => {
    const newIsOpen = !state.sidebar.isOpen;
    updateNestedState('sidebar', 'isOpen', newIsOpen);
    emit(newIsOpen ? EVENTS.SIDEBAR_OPEN : EVENTS.SIDEBAR_CLOSE);
  }, [state.sidebar.isOpen, updateNestedState, emit]);
  
  const setOpen = useCallback((isOpen: boolean) => {
    updateNestedState('sidebar', 'isOpen', isOpen);
    emit(isOpen ? EVENTS.SIDEBAR_OPEN : EVENTS.SIDEBAR_CLOSE);
  }, [updateNestedState, emit]);
  
  const setCollapsed = useCallback((isCollapsed: boolean) => {
    updateNestedState('sidebar', 'isCollapsed', isCollapsed);
  }, [updateNestedState]);
  
  return {
    isOpen: state.sidebar.isOpen,
    isCollapsed: state.sidebar.isCollapsed,
    toggle,
    setOpen,
    setCollapsed,
  };
};

/**
 * Hook for modal state management
 */
export const useModalState = (modalId: string) => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const isOpen = state.modals[modalId] || false;
  
  const open = useCallback(() => {
    updateNestedState('modals', modalId, true);
    emit(EVENTS.MODAL_OPEN, { modalId });
  }, [modalId, updateNestedState, emit]);
  
  const close = useCallback(() => {
    updateNestedState('modals', modalId, false);
    emit(EVENTS.MODAL_CLOSE, { modalId });
  }, [modalId, updateNestedState, emit]);
  
  const toggle = useCallback(() => {
    const newIsOpen = !isOpen;
    updateNestedState('modals', modalId, newIsOpen);
    emit(newIsOpen ? EVENTS.MODAL_OPEN : EVENTS.MODAL_CLOSE, { modalId });
  }, [isOpen, modalId, updateNestedState, emit]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

/**
 * Hook for loading state management
 */
export const useLoadingState = (key: string) => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const isLoading = state.loading[key] || false;
  
  const setLoading = useCallback((loading: boolean) => {
    updateNestedState('loading', key, loading);
    emit(loading ? EVENTS.LOADING_START : EVENTS.LOADING_END, { key });
  }, [key, updateNestedState, emit]);
  
  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    try {
      return await asyncFn();
    } finally {
      setLoading(false);
    }
  }, [setLoading]);
  
  return {
    isLoading,
    setLoading,
    withLoading,
  };
};

/**
 * Hook for filter state management
 */
export const useFilterState = (filterKey: string) => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const filter = state.filters[filterKey];
  
  const setFilter = useCallback((value: any) => {
    updateNestedState('filters', filterKey, value);
    emit(EVENTS.USER_FILTER, { key: filterKey, value });
  }, [filterKey, updateNestedState, emit]);
  
  const clearFilter = useCallback(() => {
    updateNestedState('filters', filterKey, undefined);
    emit(EVENTS.USER_FILTER, { key: filterKey, value: undefined });
  }, [filterKey, updateNestedState, emit]);
  
  return {
    filter,
    setFilter,
    clearFilter,
    hasFilter: filter !== undefined && filter !== null && filter !== '',
  };
};

/**
 * Hook for selection state management
 */
export const useSelectionState = (selectionKey: string) => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const selection = state.selections[selectionKey];
  
  const setSelection = useCallback((value: any) => {
    updateNestedState('selections', selectionKey, value);
    emit(EVENTS.USER_SELECTION, { key: selectionKey, value });
  }, [selectionKey, updateNestedState, emit]);
  
  const clearSelection = useCallback(() => {
    updateNestedState('selections', selectionKey, undefined);
    emit(EVENTS.USER_SELECTION, { key: selectionKey, value: undefined });
  }, [selectionKey, updateNestedState, emit]);
  
  const addToSelection = useCallback((item: any) => {
    const currentSelection = Array.isArray(selection) ? selection : [];
    const newSelection = [...currentSelection, item];
    setSelection(newSelection);
  }, [selection, setSelection]);
  
  const removeFromSelection = useCallback((item: any) => {
    if (Array.isArray(selection)) {
      const newSelection = selection.filter(s => s !== item);
      setSelection(newSelection);
    }
  }, [selection, setSelection]);
  
  return {
    selection,
    setSelection,
    clearSelection,
    addToSelection,
    removeFromSelection,
    hasSelection: selection !== undefined && selection !== null,
    selectionCount: Array.isArray(selection) ? selection.length : 0,
  };
};

/**
 * Hook for notification management
 */
export const useNotificationState = () => {
  const { state, updateState } = useGlobalState();
  const emit = useEventEmitter();
  
  const addNotification = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
    };
    
    updateState('notifications', prev => ({
      count: prev.count + 1,
      items: [notification, ...prev.items],
    }));
    
    emit(EVENTS.NOTIFICATION_SHOW, notification);
  }, [updateState, emit]);
  
  const removeNotification = useCallback((id: string) => {
    updateState('notifications', prev => ({
      count: Math.max(0, prev.count - 1),
      items: prev.items.filter(item => item.id !== id),
    }));
    
    emit(EVENTS.NOTIFICATION_HIDE, { id });
  }, [updateState, emit]);
  
  const markAsRead = useCallback((id: string) => {
    updateState('notifications', prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, isRead: true } : item
      ),
    }));
  }, [updateState]);
  
  const clearAll = useCallback(() => {
    updateState('notifications', {
      count: 0,
      items: [],
    });
  }, [updateState]);
  
  return {
    notifications: state.notifications.items,
    count: state.notifications.count,
    unreadCount: state.notifications.items.filter(n => !n.isRead).length,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
  };
};

/**
 * Hook for cache management
 */
export const useCacheState = (cacheKey: string) => {
  const { state, updateNestedState } = useGlobalState();
  
  const cache = state.cache[cacheKey];
  
  const setCache = useCallback((value: any) => {
    updateNestedState('cache', cacheKey, value);
  }, [cacheKey, updateNestedState]);
  
  const clearCache = useCallback(() => {
    updateNestedState('cache', cacheKey, undefined);
  }, [cacheKey, updateNestedState]);
  
  const updateCache = useCallback((update: (prev: any) => any) => {
    const newValue = update(cache);
    setCache(newValue);
  }, [cache, setCache]);
  
  return {
    cache,
    setCache,
    clearCache,
    updateCache,
    hasCache: cache !== undefined,
  };
};

/**
 * Hook for user preferences
 */
export const usePreferencesState = () => {
  const { state, updateNestedState } = useGlobalState();
  const emit = useEventEmitter();
  
  const setLanguage = useCallback((language: 'ar' | 'en') => {
    updateNestedState('preferences', 'language', language);
    updateNestedState('preferences', 'rtl', language === 'ar');
    emit(EVENTS.LANGUAGE_CHANGE, { language });
  }, [updateNestedState, emit]);
  
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    updateNestedState('preferences', 'theme', theme);
    emit(EVENTS.THEME_CHANGE, { theme });
  }, [updateNestedState, emit]);
  
  const setRtl = useCallback((rtl: boolean) => {
    updateNestedState('preferences', 'rtl', rtl);
  }, [updateNestedState]);
  
  return {
    preferences: state.preferences,
    setLanguage,
    setTheme,
    setRtl,
  };
};

// ===============================
// Utility Hooks
// ===============================

/**
 * Hook to sync state across components with the same key
 */
export const useSyncedState = <T>(
  key: string,
  initialValue: T
): [T, (value: StateUpdate<T>) => void] => {
  const [localState, setLocalState] = useState<T>(initialValue);
  const emit = useEventEmitter();
  const syncRef = useRef<T>(initialValue);
  
  // Listen for external updates
  useEventListener(
    `sync:${key}`,
    (data: T) => {
      if (data !== syncRef.current) {
        setLocalState(data);
        syncRef.current = data;
      }
    },
    [key]
  );
  
  const updateState = useCallback((update: StateUpdate<T>) => {
    const newValue = typeof update === 'function'
      ? (update as (prev: T) => T)(localState)
      : update;
    
    setLocalState(newValue);
    syncRef.current = newValue;
    emit(`sync:${key}`, newValue);
  }, [localState, key, emit]);
  
  return [localState, updateState];
};

/**
 * Hook for cross-component communication
 */
export const useCommunication = () => {
  const emit = useEventEmitter();
  
  const notifyDataChange = useCallback((
    type: 'created' | 'updated' | 'deleted',
    entityType: string,
    data: any
  ) => {
    emit(`${entityType}:${type}`, data);
    emit(EVENTS.DATA_UPDATED, { type, entityType, data });
  }, [emit]);
  
  const notifyUserAction = useCallback((action: string, data?: any) => {
    emit(EVENTS.USER_ACTION, { action, data, timestamp: new Date() });
  }, [emit]);
  
  const requestRefresh = useCallback((target?: string) => {
    emit(EVENTS.DATA_REFRESH, { target, timestamp: new Date() });
  }, [emit]);
  
  return {
    emit,
    notifyDataChange,
    notifyUserAction,
    requestRefresh,
  };
};

// ===============================
// Export Store for Advanced Usage
// ===============================

export { globalStore }; 