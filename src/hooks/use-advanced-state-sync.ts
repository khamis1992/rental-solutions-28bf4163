import { useEffect, useCallback, useState, useRef } from 'react';
import { globalEventBus, EVENTS } from '@/utils/component-communication';

// ===============================
// Advanced Real-Time State Sync
// ===============================

interface SyncConfig {
  key: string;
  autoSync?: boolean;
  syncInterval?: number;
  persistToStorage?: boolean;
  broadcastToTabs?: boolean;
  compression?: boolean;
  validation?: (data: any) => boolean;
}

interface SyncState<T> {
  data: T;
  version: number;
  timestamp: number;
  source: string;
  checksum?: string;
}

export const useAdvancedStateSync = <T = any>(
  config: SyncConfig,
  initialData?: T
) => {
  const { 
    key, 
    autoSync = true, 
    syncInterval = 1000,
    persistToStorage = false,
    broadcastToTabs = false,
    compression = false,
    validation 
  } = config;

  const [syncState, setSyncState] = useState<SyncState<T>>({
    data: initialData as T,
    version: 0,
    timestamp: Date.now(),
    source: 'initial'
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const componentId = useRef(`sync_${key}_${Date.now()}`);
  const lastBroadcast = useRef<number>(0);

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }, []);

  // Store data with versioning
  const storeData = useCallback((newData: T, source: string = 'update') => {
    const newState: SyncState<T> = {
      data: newData,
      version: syncState.version + 1,
      timestamp: Date.now(),
      source,
      checksum: generateChecksum(newData)
    };

    setSyncState(newState);

    if (persistToStorage) {
      try {
        localStorage.setItem(`sync_${key}`, JSON.stringify(newState));
      } catch (error) {
        console.warn(`[StateSync] Failed to persist ${key}:`, error);
      }
    }

    return true;
  }, [key, syncState.version, generateChecksum, persistToStorage]);

  // Update data
  const updateData = useCallback((
    newData: T | ((prev: T) => T),
    source: string = 'manual'
  ) => {
    const resolvedData = typeof newData === 'function'
      ? (newData as (prev: T) => T)(syncState.data)
      : newData;

    const success = storeData(resolvedData, source);
    
    if (success && autoSync) {
      globalEventBus.emit(EVENTS.DATA_UPDATED, {
        key,
        data: resolvedData,
        version: syncState.version + 1,
        source,
        componentId: componentId.current
      });
    }

    return success;
  }, [syncState.data, syncState.version, storeData, autoSync, key]);

  // Force sync
  const syncFromExternal = useCallback((externalState: SyncState<T>) => {
    if (externalState.version > syncState.version) {
      setSyncState(externalState);
      return true;
    }
    return false;
  }, [syncState.version]);

  // Listen for external updates
  useEffect(() => {
    if (!autoSync) return;

    const handleExternalUpdate = (eventData: any) => {
      if (eventData.key === key && eventData.componentId !== componentId.current) {
        const externalState: SyncState<T> = {
          data: eventData.data,
          version: eventData.version,
          timestamp: Date.now(),
          source: eventData.source
        };

        syncFromExternal(externalState);
      }
    };

    const unsubscribe = globalEventBus.on(EVENTS.DATA_UPDATED, handleExternalUpdate);
    return unsubscribe;
  }, [autoSync, key, syncFromExternal]);

  return {
    data: syncState.data,
    version: syncState.version,
    timestamp: syncState.timestamp,
    source: syncState.source,
    isStale: Date.now() - syncState.timestamp > (syncInterval * 2),
    updateData,
    syncFromExternal,
    forceSync: () => globalEventBus.emit(EVENTS.DATA_REFRESH, { key }),
    clearData: () => {
      updateData(initialData as T, 'clear');
      if (persistToStorage) {
        localStorage.removeItem(`sync_${key}`);
      }
    }
  };
};

// ===============================
// Smart Cache Hook
// ===============================

interface SmartCacheConfig {
  maxAge?: number;
  maxSize?: number;
  autoCleanup?: boolean;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

export const useSmartCache = <T = any>(
  cacheKey: string,
  config: SmartCacheConfig = {}
) => {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
    autoCleanup = true
  } = config;

  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Clean expired items
  const cleanup = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    let removedCount = 0;

    for (const [key, item] of cache.entries()) {
      if (now - item.timestamp > maxAge) {
        cache.delete(key);
        removedCount++;
      }
    }

    if (cache.size > maxSize) {
      const sortedItems = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
      
      const itemsToRemove = cache.size - maxSize;
      for (let i = 0; i < itemsToRemove; i++) {
        cache.delete(sortedItems[i][0]);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      globalEventBus.emit('cache:cleanup', {
        cacheKey,
        removedItems: removedCount,
        remainingItems: cache.size
      });
    }
  }, [cacheKey, maxAge, maxSize]);

  // Set cache item
  const set = useCallback((key: string, data: T) => {
    const now = Date.now();
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccess: now
    };

    cacheRef.current.set(key, item);

    if (autoCleanup) {
      cleanup();
    }
  }, [autoCleanup, cleanup]);

  // Get cache item
  const get = useCallback((key: string): T | null => {
    const item = cacheRef.current.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > maxAge) {
      cacheRef.current.delete(key);
      return null;
    }

    item.accessCount++;
    item.lastAccess = Date.now();

    return item.data;
  }, [maxAge]);

  // Setup auto-cleanup
  useEffect(() => {
    if (autoCleanup) {
      cleanupIntervalRef.current = setInterval(cleanup, maxAge / 2);
      
      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
      };
    }
  }, [autoCleanup, cleanup, maxAge]);

  return {
    set,
    get,
    has: (key: string) => cacheRef.current.has(key),
    delete: (key: string) => cacheRef.current.delete(key),
    clear: () => cacheRef.current.clear(),
    size: () => cacheRef.current.size
  };
};
