import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface BackgroundSyncProps {
  isOnline: boolean;
}

interface SyncItem {
  id: string;
  type: 'agreement' | 'payment' | 'customer' | 'vehicle' | 'maintenance';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export const BackgroundSync: React.FC<BackgroundSyncProps> = ({ isOnline }) => {
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isSync, setIsSync] = useState(false);
  const [syncStats, setSyncStats] = useState({
    pending: 0,
    completed: 0,
    failed: 0,
    lastSync: null as Date | null
  });
  const { toast } = useToast();

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  useEffect(() => {
    // Load sync queue from localStorage
    const savedQueue = localStorage.getItem('pwa-sync-queue');
    if (savedQueue) {
      try {
        const queue = JSON.parse(savedQueue) as SyncItem[];
        setSyncQueue(queue);
        updateSyncStats(queue);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load sync queue:', error);
        }
      }
    }

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Listen for sync events
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETED') {
            handleSyncCompleted(event.data.payload);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      // Start sync when coming online
      startSync();
    }
  }, [isOnline, syncQueue.length]);

  const updateSyncStats = (queue: SyncItem[]) => {
    const pending = queue.filter(item => item.retryCount < 3).length;
    const failed = queue.filter(item => item.retryCount >= 3).length;
    
    setSyncStats(prev => ({
      ...prev,
      pending,
      failed
    }));
  };

  const addToSyncQueue = (item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const newItem: SyncItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0
    };

    const updatedQueue = [...syncQueue, newItem];
    setSyncQueue(updatedQueue);
    localStorage.setItem('pwa-sync-queue', JSON.stringify(updatedQueue));
    updateSyncStats(updatedQueue);

    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).sync.register('background-sync').catch((error: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to register background sync:', error);
          }
        });
      });
    }

    toast({
      title: isArabic ? 'تم حفظ البيانات محلياً' : 'Data Saved Locally',
      description: isArabic ? 'سيتم المزامنة عند الاتصال بالإنترنت' : 'Will sync when online',
      duration: 3000,
    });
  };

  const startSync = async () => {
    if (isSync || !isOnline) return;

    setIsSync(true);
    const itemsToSync = syncQueue.filter(item => item.retryCount < 3);

    for (const item of itemsToSync) {
      try {
        await syncItem(item);
        // Remove from queue on success
        const updatedQueue = syncQueue.filter(q => q.id !== item.id);
        setSyncQueue(updatedQueue);
        localStorage.setItem('pwa-sync-queue', JSON.stringify(updatedQueue));
        
        setSyncStats(prev => ({
          ...prev,
          completed: prev.completed + 1,
          lastSync: new Date()
        }));

      } catch (error) {
        // Increase retry count
        const updatedQueue = syncQueue.map(q => 
          q.id === item.id 
            ? { ...q, retryCount: q.retryCount + 1, lastError: (error as Error).message }
            : q
        );
        setSyncQueue(updatedQueue);
        localStorage.setItem('pwa-sync-queue', JSON.stringify(updatedQueue));
        
        if (item.retryCount >= 2) {
          setSyncStats(prev => ({
            ...prev,
            failed: prev.failed + 1
          }));
        }
      }
    }

    updateSyncStats(syncQueue);
    setIsSync(false);

    if (syncStats.completed > 0) {
      toast({
        title: isArabic ? 'تمت المزامنة بنجاح' : 'Sync Completed',
        description: isArabic ? 
          `تم مزامنة ${syncStats.completed} عنصر` : 
          `${syncStats.completed} items synced`,
        duration: 3000,
      });
    }
  };

  const syncItem = async (item: SyncItem) => {
    const endpoint = getEndpointForType(item.type);
    const url = `/api/${endpoint}`;
    
    let method = 'POST';
    let body = item.data;
    
    if (item.action === 'update') {
      method = 'PUT';
    } else if (item.action === 'delete') {
      method = 'DELETE';
      body = { id: item.data.id };
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const getEndpointForType = (type: string) => {
    switch (type) {
      case 'agreement': return 'agreements';
      case 'payment': return 'payments';
      case 'customer': return 'customers';
      case 'vehicle': return 'vehicles';
      case 'maintenance': return 'maintenance';
      default: return type;
    }
  };

  const handleSyncCompleted = (payload: any) => {
    toast({
      title: isArabic ? 'تمت المزامنة في الخلفية' : 'Background Sync Completed',
      description: isArabic ? 
        `تم مزامنة ${payload.count} عنصر` : 
        `${payload.count} items synced`,
      duration: 3000,
    });
  };

  const handleRetrySync = () => {
    startSync();
  };

  const handleClearQueue = () => {
    const failedItems = syncQueue.filter(item => item.retryCount >= 3);
    setSyncQueue([]);
    localStorage.removeItem('pwa-sync-queue');
    updateSyncStats([]);
    
    if (failedItems.length > 0) {
      toast({
        title: isArabic ? 'تم مسح قائمة المزامنة' : 'Sync Queue Cleared',
        description: isArabic ? 
          `تم حذف ${failedItems.length} عنصر فاشل` : 
          `${failedItems.length} failed items removed`,
        duration: 3000,
      });
    }
  };

  // Don't show if no sync items
  if (syncQueue.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-20 right-4 z-40 max-w-sm"
      >
        <Card className="shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                {isOnline ? (
                  <Cloud className="w-5 h-5 text-green-500" />
                ) : (
                  <CloudOff className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isArabic ? 'المزامنة' : 'Sync'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isSync && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                  {isOnline ? (isArabic ? 'متصل' : 'Online') : (isArabic ? 'غير متصل' : 'Offline')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              {syncStats.pending > 0 && (
                <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span>{isArabic ? 'في الانتظار' : 'Pending'}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {syncStats.pending}
                  </Badge>
                </div>
              )}

              {syncStats.completed > 0 && (
                <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{isArabic ? 'مكتمل' : 'Completed'}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {syncStats.completed}
                  </Badge>
                </div>
              )}

              {syncStats.failed > 0 && (
                <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>{isArabic ? 'فاشل' : 'Failed'}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {syncStats.failed}
                  </Badge>
                </div>
              )}

              {syncStats.lastSync && (
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'آخر مزامنة: ' : 'Last sync: '}
                  {syncStats.lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>

            <div className={`flex gap-2 mt-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Button
                size="sm"
                onClick={handleRetrySync}
                disabled={isSync || !isOnline}
                className="flex-1 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {isArabic ? 'إعادة المحاولة' : 'Retry'}
              </Button>
              
              {syncStats.failed > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearQueue}
                  className="text-xs"
                >
                  {isArabic ? 'مسح' : 'Clear'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );

  // Export function for use in other components
  (window as any).addToSyncQueue = addToSyncQueue;
};
