import { useEffect, useCallback } from 'react';
import { globalEventBus, EVENTS } from '@/utils/component-communication';

// ===============================
// Cross-Page Data Sync System
// ===============================

interface PageSyncConfig {
  pageKey: string;
  syncKeys: string[];
  bidirectional?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface SyncEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'REFRESH';
  pageKey: string;
  syncKey: string;
  data: any;
  timestamp: number;
}

class CrossPageSyncManager {
  private static instance: CrossPageSyncManager;
  private pageConfigs = new Map<string, PageSyncConfig>();
  private activeSyncs = new Map<string, any>();
  private eventQueue: SyncEvent[] = [];

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): CrossPageSyncManager {
    if (!CrossPageSyncManager.instance) {
      CrossPageSyncManager.instance = new CrossPageSyncManager();
    }
    return CrossPageSyncManager.instance;
  }

  // Register page for sync
  public registerPage(config: PageSyncConfig): void {
    this.pageConfigs.set(config.pageKey, config);
    
    if (config.autoRefresh && config.refreshInterval) {
      this.setupAutoRefresh(config);
    }

    console.log(`Registered page ${config.pageKey} for sync`);
  }

  // Unregister page
  public unregisterPage(pageKey: string): void {
    this.pageConfigs.delete(pageKey);
    
    for (const [key, _] of this.activeSyncs) {
      if (key.startsWith(pageKey)) {
        this.activeSyncs.delete(key);
      }
    }

    console.log(`Unregistered page ${pageKey} from sync`);
  }

  // Get synced data
  public getSyncedData(pageKey: string, syncKey: string): any {
    const key = `${pageKey}:${syncKey}`;
    return this.activeSyncs.get(key);
  }

  // Set synced data
  public setSyncedData(pageKey: string, syncKey: string, data: any): void {
    const key = `${pageKey}:${syncKey}`;
    this.activeSyncs.set(key, data);

    const syncEvent: SyncEvent = {
      type: 'UPDATE',
      pageKey,
      syncKey,
      data,
      timestamp: Date.now()
    };

    this.broadcastToOtherPages(syncEvent);
  }

  // Merge data objects
  private mergeData(existing: any, incoming: any): any {
    if (Array.isArray(existing) && Array.isArray(incoming)) {
      const merged = [...existing];
      
      for (const item of incoming) {
        const existingIndex = merged.findIndex(m => m.id === item.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...item };
        } else {
          merged.push(item);
        }
      }
      
      return merged;
    } else if (typeof existing === 'object' && typeof incoming === 'object') {
      return { ...existing, ...incoming };
    } else {
      return incoming;
    }
  }

  // Broadcast to other pages
  private broadcastToOtherPages(event: SyncEvent): void {
    for (const [pageKey, config] of this.pageConfigs) {
      if (pageKey !== event.pageKey && config.syncKeys.includes(event.syncKey)) {
        globalEventBus.emit('cross-page:sync', {
          ...event,
          targetPageKey: pageKey
        });
      }
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    globalEventBus.on('cross-page:sync', (eventData) => {
      const key = `${eventData.pageKey}:${eventData.syncKey}`;
      this.activeSyncs.set(key, eventData.data);
    });

    globalEventBus.on(EVENTS.NAVIGATION_START, (navData) => {
      this.savePageState(navData.fromPage);
    });

    globalEventBus.on(EVENTS.NAVIGATION_COMPLETE, (navData) => {
      this.restorePageState(navData.toPage);
    });
  }

  // Setup auto-refresh
  private setupAutoRefresh(config: PageSyncConfig): void {
    setInterval(() => {
      for (const syncKey of config.syncKeys) {
        const event: SyncEvent = {
          type: 'REFRESH',
          pageKey: config.pageKey,
          syncKey,
          data: null,
          timestamp: Date.now()
        };

        this.broadcastToOtherPages(event);
      }
    }, config.refreshInterval);
  }

  // Save page state
  private savePageState(pageKey: string): void {
    const config = this.pageConfigs.get(pageKey);
    if (!config) return;

    const pageState: any = {};
    
    for (const syncKey of config.syncKeys) {
      const key = `${pageKey}:${syncKey}`;
      const data = this.activeSyncs.get(key);
      if (data) {
        pageState[syncKey] = data;
      }
    }

    sessionStorage.setItem(`page-state:${pageKey}`, JSON.stringify(pageState));
  }

  // Restore page state
  private restorePageState(pageKey: string): void {
    const config = this.pageConfigs.get(pageKey);
    if (!config) return;

    try {
      const storedState = sessionStorage.getItem(`page-state:${pageKey}`);
      if (!storedState) return;

      const pageState = JSON.parse(storedState);
      
      for (const [syncKey, data] of Object.entries(pageState)) {
        if (config.syncKeys.includes(syncKey)) {
          const key = `${pageKey}:${syncKey}`;
          this.activeSyncs.set(key, data);
        }
      }
    } catch (error) {
      console.warn(`Failed to restore state for page ${pageKey}:`, error);
    }
  }
}

// ===============================
// React Hook for Cross-Page Sync
// ===============================

export const useCrossPageSync = (config: PageSyncConfig) => {
  const syncManager = CrossPageSyncManager.getInstance();

  useEffect(() => {
    syncManager.registerPage(config);
    
    return () => {
      syncManager.unregisterPage(config.pageKey);
    };
  }, [config.pageKey]);

  const syncData = useCallback((syncKey: string, data: any) => {
    syncManager.setSyncedData(config.pageKey, syncKey, data);
  }, [config.pageKey]);

  const getSyncedData = useCallback((syncKey: string) => {
    return syncManager.getSyncedData(config.pageKey, syncKey);
  }, [config.pageKey]);

  const triggerRefresh = useCallback((syncKey: string) => {
    const event: SyncEvent = {
      type: 'REFRESH',
      pageKey: config.pageKey,
      syncKey,
      data: null,
      timestamp: Date.now()
    };

    globalEventBus.emit('cross-page:refresh', event);
  }, [config.pageKey]);

  return {
    syncData,
    getSyncedData,
    triggerRefresh
  };
};

// ===============================
// Export Singleton
// ===============================

export const crossPageSync = CrossPageSyncManager.getInstance();
export type { PageSyncConfig, SyncEvent };
