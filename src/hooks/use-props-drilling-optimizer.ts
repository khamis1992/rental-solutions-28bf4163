import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  useSyncedState, 
  useGlobalState,
  useFilterState,
  useSelectionState,
  useCacheState
} from './use-global-state-management';
import { useComponentMessaging, useCommunicationContext } from '@/components/providers/CommunicationProvider';

// ===============================
// Types & Interfaces
// ===============================

interface PropsDrillingConfig {
  // Component identification
  componentName: string;
  
  // Data sharing configuration
  shareData?: boolean;
  shareFilters?: boolean;
  shareSelections?: boolean;
  shareLoading?: boolean;
  
  // Persistence configuration
  persistState?: boolean;
  
  // Auto-sync configuration
  autoSync?: boolean;
  syncKey?: string;
}

interface ComponentDataPacket {
  // Component identification
  componentId: string;
  componentName: string;
  
  // Data payload
  data: any;
  
  // Metadata
  timestamp: number;
  version: number;
  
  // Sync configuration
  sync: boolean;
  persist: boolean;
}

// ===============================
// Props Drilling Optimizer Hook
// ===============================

export const usePropsDrillingOptimizer = <T = any>(
  config: PropsDrillingConfig,
  initialData?: T
) => {
  const { 
    componentName, 
    shareData = true, 
    shareFilters = true, 
    shareSelections = true, 
    shareLoading = true,
    persistState = false,
    autoSync = true,
    syncKey 
  } = config;
  
  const messaging = useComponentMessaging();
  const { eventBus } = useCommunicationContext();
  const globalState = useGlobalState();
  
  // Generate unique keys for this component
  const componentId = useMemo(() => 
    `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    [componentName]
  );
  
  const dataKey = syncKey || `${componentName}_data`;
  const filterKey = `${componentName}_filter`;
  const selectionKey = `${componentName}_selection`;
  const loadingKey = `${componentName}_loading`;
  
  // ===============================
  // State Management
  // ===============================
  
  // Synced data state
  const [sharedData, setSharedData] = useSyncedState<T>(
    dataKey,
    initialData || ({} as T)
  );
  
  // Filter state
  const filterState = shareFilters ? useFilterState(filterKey) : null;
  
  // Selection state
  const selectionState = shareSelections ? useSelectionState(selectionKey) : null;
  
  // Cache state
  const cache = useCacheState(`${componentName}_cache`);
  
  // ===============================
  // Data Packet Management
  // ===============================
  
  const versionRef = useRef<number>(1);
  
  const createDataPacket = useCallback((data: T): ComponentDataPacket => {
    versionRef.current += 1;
    
    return {
      componentId,
      componentName,
      data,
      timestamp: Date.now(),
      version: versionRef.current,
      sync: autoSync,
      persist: persistState,
    };
  }, [componentId, componentName, autoSync, persistState]);
  
  // ===============================
  // Data Operations
  // ===============================
  
  const updateData = useCallback((
    newData: T | ((prevData: T) => T),
    options?: {
      broadcast?: boolean;
      cache?: boolean;
      sync?: boolean;
    }
  ) => {
    const { broadcast = true, cache: shouldCache = false, sync = autoSync } = options || {};
    
    // Update shared data
    setSharedData(newData);
    
    // Cache if requested
    if (shouldCache) {
      const finalData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(sharedData)
        : newData;
      cache.setCache(finalData);
    }
    
    // Broadcast to other components if requested
    if (broadcast && shareData) {
      const finalData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(sharedData)
        : newData;
      
      const packet = createDataPacket(finalData);
      messaging.emit(`data:${dataKey}`, packet);
    }
    
    // Notify about data change
    if (sync) {
      messaging.notifyUpdated('component_data', {
        componentName,
        dataKey,
        timestamp: Date.now(),
      });
    }
  }, [
    setSharedData, 
    sharedData, 
    cache, 
    shareData, 
    dataKey, 
    createDataPacket, 
    messaging, 
    componentName, 
    autoSync
  ]);
  
  const resetData = useCallback(() => {
    setSharedData(initialData || ({} as T));
    cache.clearCache();
    
    if (shareData) {
      messaging.emit(`reset:${dataKey}`, { componentName, timestamp: Date.now() });
    }
  }, [setSharedData, initialData, cache, shareData, dataKey, messaging, componentName]);
  
  // ===============================
  // Filter Operations
  // ===============================
  
  const updateFilter = useCallback((filter: any) => {
    if (filterState) {
      filterState.setFilter(filter);
      
      // Broadcast filter change
      messaging.emit(`filter:${filterKey}`, {
        componentName,
        filter,
        timestamp: Date.now(),
      });
    }
  }, [filterState, filterKey, messaging, componentName]);
  
  const clearFilter = useCallback(() => {
    if (filterState) {
      filterState.clearFilter();
      
      messaging.emit(`filter:clear:${filterKey}`, {
        componentName,
        timestamp: Date.now(),
      });
    }
  }, [filterState, filterKey, messaging, componentName]);
  
  // ===============================
  // Selection Operations
  // ===============================
  
  const updateSelection = useCallback((selection: any) => {
    if (selectionState) {
      selectionState.setSelection(selection);
      
      messaging.emit(`selection:${selectionKey}`, {
        componentName,
        selection,
        timestamp: Date.now(),
      });
    }
  }, [selectionState, selectionKey, messaging, componentName]);
  
  const clearSelection = useCallback(() => {
    if (selectionState) {
      selectionState.clearSelection();
      
      messaging.emit(`selection:clear:${selectionKey}`, {
        componentName,
        timestamp: Date.now(),
      });
    }
  }, [selectionState, selectionKey, messaging, componentName]);
  
  // ===============================
  // Loading Operations
  // ===============================
  
  const setLoading = useCallback((loading: boolean) => {
    if (shareLoading) {
      globalState.updateNestedState('loading', loadingKey, loading);
      
      messaging.emit(`loading:${loadingKey}`, {
        componentName,
        loading,
        timestamp: Date.now(),
      });
    }
  }, [shareLoading, globalState, loadingKey, messaging, componentName]);
  
  const withLoading = useCallback(async <R>(
    asyncOperation: () => Promise<R>
  ): Promise<R> => {
    setLoading(true);
    try {
      return await asyncOperation();
    } finally {
      setLoading(false);
    }
  }, [setLoading]);
  
  // ===============================
  // Communication Helpers
  // ===============================
  
  const broadcastToComponents = useCallback((
    message: any,
    targetComponents?: string[]
  ) => {
    if (targetComponents) {
      targetComponents.forEach(target => {
        messaging.emit(`component:${target}`, {
          from: componentName,
          message,
          timestamp: Date.now(),
        });
      });
    } else {
      messaging.emit('component:broadcast', {
        from: componentName,
        message,
        timestamp: Date.now(),
      });
    }
  }, [messaging, componentName]);
  
  const subscribeToComponent = useCallback((
    sourceComponent: string,
    callback: (message: any) => void
  ) => {
    return eventBus.on(
      `component:${sourceComponent}`,
      callback
    );
  }, [eventBus]);
  
  // ===============================
  // Advanced Operations
  // ===============================
  
  const shareWithChildren = useCallback((
    childrenData: Record<string, any>
  ) => {
    Object.entries(childrenData).forEach(([childKey, data]) => {
      messaging.emit(`parent:${componentName}:${childKey}`, {
        data,
        parentComponent: componentName,
        timestamp: Date.now(),
      });
    });
  }, [messaging, componentName]);
  
  const receiveFromParent = useCallback((
    parentComponent: string,
    callback: (data: any) => void
  ) => {
    return eventBus.on(
      `parent:${parentComponent}:${componentName}`,
      callback
    );
  }, [eventBus, componentName]);
  
  const createDataBridge = useCallback((
    bridgeKey: string,
    data: any
  ) => {
    messaging.emit(`bridge:${bridgeKey}`, {
      componentName,
      data,
      timestamp: Date.now(),
    });
    
    return () => {
      messaging.emit(`bridge:close:${bridgeKey}`, {
        componentName,
        timestamp: Date.now(),
      });
    };
  }, [messaging, componentName]);
  
  const connectToBridge = useCallback((
    bridgeKey: string,
    callback: (data: any) => void
  ) => {
    return eventBus.on(`bridge:${bridgeKey}`, callback);
  }, [eventBus]);
  
  // ===============================
  // Component Lifecycle
  // ===============================
  
  useEffect(() => {
    // Register component
    messaging.emit('component:register', {
      componentId,
      componentName,
      config,
      timestamp: Date.now(),
    });
    
    return () => {
      // Unregister component
      messaging.emit('component:unregister', {
        componentId,
        componentName,
        timestamp: Date.now(),
      });
    };
  }, [componentId, componentName, config, messaging]);
  
  // ===============================
  // Return API
  // ===============================
  
  return {
    // Component info
    componentId,
    componentName,
    
    // Data management
    data: sharedData,
    updateData,
    resetData,
    
    // Filter management
    filter: filterState?.filter,
    updateFilter,
    clearFilter,
    hasFilter: filterState?.hasFilter,
    
    // Selection management
    selection: selectionState?.selection,
    updateSelection,
    clearSelection,
    hasSelection: selectionState?.hasSelection,
    selectionCount: selectionState?.selectionCount,
    
    // Loading management
    isLoading: shareLoading ? globalState.state.loading[loadingKey] || false : false,
    setLoading,
    withLoading,
    
    // Cache management
    cache: cache.cache,
    setCache: cache.setCache,
    clearCache: cache.clearCache,
    hasCache: cache.hasCache,
    
    // Communication
    broadcastToComponents,
    subscribeToComponent,
    shareWithChildren,
    receiveFromParent,
    createDataBridge,
    connectToBridge,
    
    // Utilities
    emit: messaging.emit,
    showSuccess: messaging.showSuccess,
    showError: messaging.showError,
    showWarning: messaging.showWarning,
    showInfo: messaging.showInfo,
    trackAction: messaging.trackAction,
  };
};

// ===============================
// Specialized Hooks
// ===============================

/**
 * Hook for parent-child component communication
 */
export const useParentChildCommunication = (
  componentName: string,
  parentName?: string
) => {
  const messaging = useComponentMessaging();
  const { eventBus } = useCommunicationContext();
  
  const sendToParent = useCallback((message: any) => {
    if (parentName) {
      messaging.emit(`child:${parentName}`, {
        from: componentName,
        message,
        timestamp: Date.now(),
      });
    }
  }, [messaging, componentName, parentName]);
  
  const sendToChild = useCallback((childName: string, message: any) => {
    messaging.emit(`child:${childName}`, {
      from: componentName,
      message,
      timestamp: Date.now(),
    });
  }, [messaging, componentName]);
  
  const onMessageFromParent = useCallback((callback: (message: any) => void) => {
    if (parentName) {
      return eventBus.on(`child:${componentName}`, callback);
    }
    return () => {};
  }, [eventBus, componentName, parentName]);
  
  const onMessageFromChild = useCallback((
    childName: string,
    callback: (message: any) => void
  ) => {
    return eventBus.on(`child:${componentName}`, (data: any) => {
      if (data.from === childName) {
        callback(data.message);
      }
    });
  }, [eventBus, componentName]);
  
  return {
    sendToParent,
    sendToChild,
    onMessageFromParent,
    onMessageFromChild,
  };
};

/**
 * Hook for sibling component communication
 */
export const useSiblingCommunication = (componentName: string) => {
  const messaging = useComponentMessaging();
  const { eventBus } = useCommunicationContext();
  
  const sendToSibling = useCallback((siblingName: string, message: any) => {
    messaging.emit(`sibling:${siblingName}`, {
      from: componentName,
      message,
      timestamp: Date.now(),
    });
  }, [messaging, componentName]);
  
  const onMessageFromSibling = useCallback((
    siblingName: string,
    callback: (message: any) => void
  ) => {
    return eventBus.on(`sibling:${componentName}`, (data: any) => {
      if (data.from === siblingName) {
        callback(data.message);
      }
    });
  }, [eventBus, componentName]);
  
  const broadcastToSiblings = useCallback((message: any) => {
    messaging.emit('sibling:broadcast', {
      from: componentName,
      message,
      timestamp: Date.now(),
    });
  }, [messaging, componentName]);
  
  const onBroadcastFromSiblings = useCallback((callback: (message: any) => void) => {
    return eventBus.on('sibling:broadcast', (data: any) => {
      if (data.from !== componentName) {
        callback(data.message);
      }
    });
  }, [eventBus, componentName]);
  
  return {
    sendToSibling,
    onMessageFromSibling,
    broadcastToSiblings,
    onBroadcastFromSiblings,
  };
};

/**
 * Hook for deep component tree communication
 */
export const useDeepCommunication = (
  componentName: string,
  treePath: string[]
) => {
  const messaging = useComponentMessaging();
  const { eventBus } = useCommunicationContext();
  
  const sendUpTree = useCallback((message: any, levels: number = 1) => {
    const targetIndex = Math.max(0, treePath.length - levels - 1);
    const target = treePath[targetIndex];
    
    if (target) {
      messaging.emit(`tree:up:${target}`, {
        from: componentName,
        path: treePath,
        message,
        timestamp: Date.now(),
      });
    }
  }, [messaging, componentName, treePath]);
  
  const sendDownTree = useCallback((message: any, targetDepth?: number) => {
    messaging.emit('tree:down', {
      from: componentName,
      path: treePath,
      targetDepth,
      message,
      timestamp: Date.now(),
    });
  }, [messaging, componentName, treePath]);
  
  const onMessageFromTree = useCallback((callback: (message: any, from: string) => void) => {
    const unsubscribers = [
      eventBus.on(`tree:up:${componentName}`, (data: any) => {
        callback(data.message, data.from);
      }),
      eventBus.on('tree:down', (data: any) => {
        const shouldReceive = treePath.some((pathComponent, index) => 
          data.path.includes(pathComponent) && 
          (!data.targetDepth || index >= data.targetDepth)
        );
        
        if (shouldReceive && data.from !== componentName) {
          callback(data.message, data.from);
        }
      }),
    ];
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [eventBus, componentName, treePath]);
  
  return {
    sendUpTree,
    sendDownTree,
    onMessageFromTree,
  };
};

// ===============================
// Export Types
// ===============================

export type { 
  PropsDrillingConfig, 
  ComponentDataPacket 
}; 