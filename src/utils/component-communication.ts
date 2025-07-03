import { useEffect, useCallback, useRef, useState } from 'react';

// ===============================
// Event Bus System
// ===============================

type EventListener<T = any> = (data: T) => void;

class EventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private onceListeners: Map<string, EventListener[]> = new Map();
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(listener);
    
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to event: ${event}`);
    }
    
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once<T = any>(event: string, listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    
    this.onceListeners.get(event)!.push(listener);
    
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed once to event: ${event}`);
    }
    
    // Return unsubscribe function
    return () => this.offOnce(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(event: string, listener: EventListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from event: ${event}`);
        }
      }
    }
  }

  /**
   * Unsubscribe from one-time event
   */
  offOnce<T = any>(event: string, listener: EventListener<T>): void {
    const listeners = this.onceListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed once from event: ${event}`);
        }
      }
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: string, data?: T): void {
    if (this.debugMode) {
      console.log(`[EventBus] Emitting event: ${event}`, data);
    }
    
    // Call regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for event: ${event}`, error);
        }
      });
    }
    
    // Call one-time listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in once listener for event: ${event}`, error);
        }
      });
      
      // Clear one-time listeners after calling them
      this.onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
      
      if (this.debugMode) {
        console.log(`[EventBus] Removed all listeners for event: ${event}`);
      }
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
      
      if (this.debugMode) {
        console.log('[EventBus] Removed all listeners');
      }
    }
  }

  /**
   * Get all active event names
   */
  getEventNames(): string[] {
    const regularEvents = Array.from(this.listeners.keys());
    const onceEvents = Array.from(this.onceListeners.keys());
    return [...new Set([...regularEvents, ...onceEvents])];
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(event: string): number {
    const regularCount = this.listeners.get(event)?.length || 0;
    const onceCount = this.onceListeners.get(event)?.length || 0;
    return regularCount + onceCount;
  }
}

// Global event bus instance
const globalEventBus = new EventBus(process.env.NODE_ENV === 'development');

// ===============================
// Event Names Constants
// ===============================

export const EVENTS = {
  // UI Events
  SIDEBAR_TOGGLE: 'sidebar:toggle',
  SIDEBAR_OPEN: 'sidebar:open',
  SIDEBAR_CLOSE: 'sidebar:close',
  
  // Modal Events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  
  // Data Events
  DATA_REFRESH: 'data:refresh',
  DATA_UPDATED: 'data:updated',
  DATA_DELETED: 'data:deleted',
  DATA_CREATED: 'data:created',
  DATA_LOADING: 'data:loading',
  
  // Filter Events
  FILTER_CHANGED: 'filter:changed',
  SEARCH_PERFORMED: 'search:performed',
  
  // Error Events
  ERROR_OCCURRED: 'error:occurred',
  
  // User Events
  USER_ACTION: 'user:action',
  USER_SELECTION: 'user:selection',
  USER_FILTER: 'user:filter',
  
  // Notification Events
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  
  // Agreement Events
  AGREEMENT_CREATED: 'agreement:created',
  AGREEMENT_UPDATED: 'agreement:updated',
  AGREEMENT_DELETED: 'agreement:deleted',
  AGREEMENT_SELECTED: 'agreement:selected',
  
  // Customer Events
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  CUSTOMER_DELETED: 'customer:deleted',
  CUSTOMER_SELECTED: 'customer:selected',
  
  // Vehicle Events
  VEHICLE_CREATED: 'vehicle:created',
  VEHICLE_UPDATED: 'vehicle:updated',
  VEHICLE_DELETED: 'vehicle:deleted',
  VEHICLE_SELECTED: 'vehicle:selected',
  
  // Payment Events
  PAYMENT_CREATED: 'payment:created',
  PAYMENT_UPDATED: 'payment:updated',
  PAYMENT_DELETED: 'payment:deleted',
  
  // Error Events (removed duplicate)
  
  // Loading Events
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end',
  
  // Navigation Events
  NAVIGATION_CHANGE: 'navigation:change',
  
  // Theme Events
  THEME_CHANGE: 'theme:change',
  
  // Language Events
  LANGUAGE_CHANGE: 'language:change',
} as const;

// ===============================
// React Hooks
// ===============================

/**
 * Hook to subscribe to events
 */
export const useEventListener = <T = any>(
  event: string,
  listener: EventListener<T>,
  dependencies: any[] = []
): void => {
  const listenerRef = useRef<EventListener<T>>();
  
  // Update listener ref when dependencies change
  useEffect(() => {
    listenerRef.current = listener;
  }, dependencies);
  
  useEffect(() => {
    const wrappedListener = (data: T) => {
      if (listenerRef.current) {
        listenerRef.current(data);
      }
    };
    
    return globalEventBus.on(event, wrappedListener);
  }, [event]);
};

/**
 * Hook to subscribe to events (one-time only)
 */
export const useEventListenerOnce = <T = any>(
  event: string,
  listener: EventListener<T>,
  dependencies: any[] = []
): void => {
  const listenerRef = useRef<EventListener<T>>();
  
  // Update listener ref when dependencies change
  useEffect(() => {
    listenerRef.current = listener;
  }, dependencies);
  
  useEffect(() => {
    const wrappedListener = (data: T) => {
      if (listenerRef.current) {
        listenerRef.current(data);
      }
    };
    
    return globalEventBus.once(event, wrappedListener);
  }, [event]);
};

/**
 * Hook to emit events
 */
export const useEventEmitter = () => {
  return useCallback(<T = any>(event: string, data?: T) => {
    globalEventBus.emit(event, data);
  }, []);
};

/**
 * Hook for component communication
 */
export const useComponentCommunication = () => {
  const emit = useEventEmitter();
  
  const subscribe = useCallback(<T = any>(
    event: string,
    listener: EventListener<T>
  ) => {
    return globalEventBus.on(event, listener);
  }, []);
  
  const subscribeOnce = useCallback(<T = any>(
    event: string,
    listener: EventListener<T>
  ) => {
    return globalEventBus.once(event, listener);
  }, []);
  
  const unsubscribe = useCallback(<T = any>(
    event: string,
    listener: EventListener<T>
  ) => {
    globalEventBus.off(event, listener);
  }, []);
  
  return {
    emit,
    subscribe,
    subscribeOnce,
    unsubscribe,
  };
};

// ===============================
// Data Synchronization
// ===============================

interface DataSyncOptions {
  key: string;
  defaultValue?: any;
  syncAcrossComponents?: boolean;
  persist?: boolean;
}

/**
 * Hook for synchronized data across components
 */
export const useSyncedData = <T = any>(options: DataSyncOptions) => {
  const { key, defaultValue, syncAcrossComponents = true, persist = false } = options;
  const [data, setData] = useState<T>(defaultValue);
  const emit = useEventEmitter();
  
  // Load persisted data
  useEffect(() => {
    if (persist) {
      const stored = localStorage.getItem(`synced_data_${key}`);
      if (stored) {
        try {
          setData(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to parse stored data:', error);
        }
      }
    }
  }, [key, persist]);
  
  // Listen for data changes from other components
  useEventListener(
    `data:sync:${key}`,
    (newData: T) => {
      setData(newData);
    },
    [key]
  );
  
  // Update data and sync across components
  const updateData = useCallback((newData: T | ((prevData: T) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prevData: T) => T)(data)
      : newData;
    
    setData(updatedData);
    
    // Persist if enabled
    if (persist) {
      localStorage.setItem(`synced_data_${key}`, JSON.stringify(updatedData));
    }
    
    // Sync across components if enabled
    if (syncAcrossComponents) {
      emit(`data:sync:${key}`, updatedData);
    }
  }, [data, key, persist, syncAcrossComponents, emit]);
  
  return [data, updateData] as const;
};

// ===============================
// Component State Manager
// ===============================

class ComponentStateManager {
  private state: Map<string, any> = new Map();
  private subscribers: Map<string, Set<EventListener>> = new Map();
  
  /**
   * Set component state
   */
  setState(componentId: string, newState: any): void {
    this.state.set(componentId, newState);
    
    // Notify subscribers
    const subscribers = this.subscribers.get(componentId);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(newState);
        } catch (error) {
          console.error(`Error in state subscriber for ${componentId}:`, error);
        }
      });
    }
  }
  
  /**
   * Get component state
   */
  getState(componentId: string): any {
    return this.state.get(componentId);
  }
  
  /**
   * Subscribe to component state changes
   */
  subscribe(componentId: string, listener: EventListener): () => void {
    if (!this.subscribers.has(componentId)) {
      this.subscribers.set(componentId, new Set());
    }
    
    this.subscribers.get(componentId)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(componentId);
      if (subscribers) {
        subscribers.delete(listener);
      }
    };
  }
  
  /**
   * Remove component state
   */
  removeState(componentId: string): void {
    this.state.delete(componentId);
    this.subscribers.delete(componentId);
  }
  
  /**
   * Get all component states
   */
  getAllStates(): Record<string, any> {
    return Object.fromEntries(this.state);
  }
}

const componentStateManager = new ComponentStateManager();

/**
 * Hook for cross-component state management
 */
export const useComponentState = <T = any>(
  componentId: string,
  initialState?: T
) => {
  const [state, setState] = useState<T>(
    componentStateManager.getState(componentId) || initialState
  );
  
  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = componentStateManager.subscribe(
      componentId,
      (newState: T) => {
        setState(newState);
      }
    );
    
    return unsubscribe;
  }, [componentId]);
  
  const updateState = useCallback((newState: T | ((prevState: T) => T)) => {
    const updatedState = typeof newState === 'function'
      ? (newState as (prevState: T) => T)(state)
      : newState;
    
    setState(updatedState);
    componentStateManager.setState(componentId, updatedState);
  }, [componentId, state]);
  
  return [state, updateState] as const;
};

// ===============================
// Utility Functions
// ===============================

/**
 * Create a namespaced event emitter
 */
export const createNamespacedEmitter = (namespace: string) => {
  return {
    emit: <T = any>(event: string, data?: T) => {
      globalEventBus.emit(`${namespace}:${event}`, data);
    },
    
    on: <T = any>(event: string, listener: EventListener<T>) => {
      return globalEventBus.on(`${namespace}:${event}`, listener);
    },
    
    once: <T = any>(event: string, listener: EventListener<T>) => {
      return globalEventBus.once(`${namespace}:${event}`, listener);
    },
    
    off: <T = any>(event: string, listener: EventListener<T>) => {
      globalEventBus.off(`${namespace}:${event}`, listener);
    },
  };
};

/**
 * Create a pub/sub system for specific data types
 */
export const createDataChannel = <T = any>(channelName: string) => {
  const channel = createNamespacedEmitter(channelName);
  
  return {
    publish: (data: T) => channel.emit('data', data),
    subscribe: (listener: EventListener<T>) => channel.on('data', listener),
    subscribeOnce: (listener: EventListener<T>) => channel.once('data', listener),
    unsubscribe: (listener: EventListener<T>) => channel.off('data', listener),
  };
};

// ===============================
// Export
// ===============================

export { 
  EventBus, 
  globalEventBus, 
  componentStateManager,
  type EventListener 
}; 
