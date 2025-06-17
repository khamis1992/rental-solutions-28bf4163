import { supabase } from '@/integrations/supabase/client';

export interface OfflineAction {
  id: string;
  type: 'payment' | 'agreement' | 'maintenance' | 'vehicle-status' | 'customer';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private offlineQueue: OfflineAction[] = [];
  private syncInProgress = false;
  private readonly MAX_RETRIES = 3;
  private readonly STORAGE_KEY = 'offline-queue';

  private constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => this.syncQueue());
    window.addEventListener('offline', () => console.log('App is offline'));

    // Sync when service worker sends message
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'sync-complete') {
          this.handleSyncComplete(event.data.successful, event.data.failed);
        }
      });
    }
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Add action to offline queue
  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    this.offlineQueue.push(offlineAction);
    this.saveQueue();

    // Register sync if online
    if (navigator.onLine) {
      await this.registerSync(action.type);
    }
  }

  // Register background sync
  private async registerSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(`sync-${tag}s`);
    } catch (error) {
      console.error('Error registering sync:', error);
      // Fallback to immediate sync
      await this.syncQueue();
    }
  }

  // Sync offline queue
  async syncQueue(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const successful: string[] = [];
    const failed: string[] = [];

    for (const action of this.offlineQueue) {
      try {
        await this.processAction(action);
        successful.push(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        action.retries++;
        
        if (action.retries >= this.MAX_RETRIES) {
          failed.push(action.id);
        }
      }
    }

    // Remove successful and permanently failed actions
    this.offlineQueue = this.offlineQueue.filter(
      action => !successful.includes(action.id) && !failed.includes(action.id)
    );
    
    this.saveQueue();
    this.syncInProgress = false;

    // Notify user of sync results
    if (successful.length > 0 || failed.length > 0) {
      this.notifySyncResults(successful.length, failed.length);
    }
  }

  // Process individual action
  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'payment':
        await this.syncPayment(action);
        break;
      case 'agreement':
        await this.syncAgreement(action);
        break;
      case 'maintenance':
        await this.syncMaintenance(action);
        break;
      case 'vehicle-status':
        await this.syncVehicleStatus(action);
        break;
      case 'customer':
        await this.syncCustomer(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Sync payment action
  private async syncPayment(action: OfflineAction): Promise<void> {
    if (action.action === 'create') {
      const { error } = await supabase
        .from('payments')
        .insert(action.data);
      
      if (error) throw error;
    } else if (action.action === 'update') {
      const { error } = await supabase
        .from('payments')
        .update(action.data)
        .eq('id', action.data.id);
      
      if (error) throw error;
    }
  }

  // Sync agreement action
  private async syncAgreement(action: OfflineAction): Promise<void> {
    if (action.action === 'create') {
      const { error } = await supabase
        .from('leases')
        .insert(action.data);
      
      if (error) throw error;
    } else if (action.action === 'update') {
      const { error } = await supabase
        .from('leases')
        .update(action.data)
        .eq('id', action.data.id);
      
      if (error) throw error;
    }
  }

  // Sync maintenance action
  private async syncMaintenance(action: OfflineAction): Promise<void> {
    if (action.action === 'create') {
      const { error } = await supabase
        .from('maintenance')
        .insert(action.data);
      
      if (error) throw error;
    } else if (action.action === 'update') {
      const { error } = await supabase
        .from('maintenance')
        .update(action.data)
        .eq('id', action.data.id);
      
      if (error) throw error;
    }
  }

  // Sync vehicle status action
  private async syncVehicleStatus(action: OfflineAction): Promise<void> {
    if (action.action === 'update') {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: action.data.status })
        .eq('id', action.data.id);
      
      if (error) throw error;
    }
  }

  // Sync customer action
  private async syncCustomer(action: OfflineAction): Promise<void> {
    if (action.action === 'create') {
      const { error } = await supabase
        .from('profiles')
        .insert(action.data);
      
      if (error) throw error;
    } else if (action.action === 'update') {
      const { error } = await supabase
        .from('profiles')
        .update(action.data)
        .eq('id', action.data.id);
      
      if (error) throw error;
    }
  }

  // Handle sync completion
  private handleSyncComplete(successful: string[], failed: string[]): void {
    // Remove synced items from queue
    this.offlineQueue = this.offlineQueue.filter(
      action => !successful.includes(action.id) && !failed.includes(action.id)
    );
    
    this.saveQueue();
    this.notifySyncResults(successful.length, failed.length);
  }

  // Notify user of sync results
  private notifySyncResults(successCount: number, failCount: number): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'show-notification',
        notification: {
          title: 'Data Sync Complete',
          body: `${successCount} items synced successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
          tag: 'sync-complete',
          icon: '/icons/icon-192x192.png'
        }
      });
    }
  }

  // Get queue status
  getQueueStatus(): { count: number; items: OfflineAction[] } {
    return {
      count: this.offlineQueue.length,
      items: [...this.offlineQueue]
    };
  }

  // Clear queue
  clearQueue(): void {
    this.offlineQueue = [];
    this.saveQueue();
  }

  // Retry failed items
  async retryFailed(): Promise<void> {
    const failedItems = this.offlineQueue.filter(
      action => action.retries >= this.MAX_RETRIES
    );
    
    // Reset retry count and try again
    failedItems.forEach(item => {
      item.retries = 0;
    });
    
    await this.syncQueue();
  }
}

// Export singleton instance
export const backgroundSyncService = BackgroundSyncService.getInstance();