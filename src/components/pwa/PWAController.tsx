import React, { useState, useEffect, useCallback } from 'react';
import { SmartInstallBanner } from './SmartInstallBanner';
import { EnhancedInstallPrompt } from './EnhancedInstallPrompt';
import { UpdatePrompt } from './UpdatePrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, Wifi, WifiOff, Download, CheckCircle, 
  AlertTriangle, RefreshCw, Bell, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PWAControllerProps {
  enableSmartBanner?: boolean;
  enableEnhancedPrompt?: boolean;
  bannerPosition?: 'top' | 'bottom' | 'floating';
  bannerTheme?: 'default' | 'premium' | 'minimal';
  showOnPages?: string[];
  enableNotifications?: boolean;
  enableOfflineSync?: boolean;
}

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  notificationPermission: NotificationPermission;
  serviceWorkerReady: boolean;
  syncInProgress: boolean;
  queuedOperations: number;
  lastSyncTime?: number;
}

interface SyncQueueItem {
  id: string;
  type: 'payment' | 'agreement' | 'maintenance' | 'customer' | 'vehicle' | 'document';
  action: string;
  data: any;
  timestamp: number;
  retries: number;
}

export const PWAController: React.FC<PWAControllerProps> = ({
  enableSmartBanner = true,
  enableEnhancedPrompt = true,
  bannerPosition = 'top',
  bannerTheme = 'default',
  showOnPages = [],
  enableNotifications = true,
  enableOfflineSync = true
}) => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    notificationPermission: 'default',
    serviceWorkerReady: false,
    syncInProgress: false,
    queuedOperations: 0
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const { toast } = useToast();

  // Initialize PWA status
  useEffect(() => {
    initializePWAStatus();
    setupEventListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializePWAStatus = async () => {
    try {
      // Check if app is installed
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

      // Check service worker
      let serviceWorkerReady = false;
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerReady = !!registration;
      }

      // Check notification permission
      const notificationPermission = 'Notification' in window ? 
        Notification.permission : 'denied';

      // Load queued operations
      const queue = loadSyncQueue();

      setPwaStatus(prev => ({
        ...prev,
        isInstalled,
        serviceWorkerReady,
        notificationPermission,
        queuedOperations: queue.length
      }));

      setSyncQueue(queue);

      console.log('[PWA Controller] Initialized with status:', {
        isInstalled,
        serviceWorkerReady,
        notificationPermission,
        queuedOperations: queue.length
      });
    } catch (error) {
      console.error('[PWA Controller] Initialization failed:', error);
    }
  };

  const setupEventListeners = () => {
    // Online/offline status
    const handleOnline = () => {
      setPwaStatus(prev => ({ ...prev, isOnline: true }));
      if (enableOfflineSync) {
        processSyncQueue();
      }
      toast({
        title: "عودة الاتصال",
        description: "تم استعادة الاتصال بالإنترنت",
        duration: 3000
      });
    };

    const handleOffline = () => {
      setPwaStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "انقطاع الاتصال",
        description: "يمكنك الاستمرار في العمل. سيتم مزامنة البيانات عند عودة الاتصال",
        duration: 5000
      });
    };

    // Service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      const { data } = event;
      
      switch (data.type) {
        case 'SYNC_SUCCESS':
          handleSyncSuccess(data);
          break;
        case 'SYNC_FAILED':
          handleSyncFailed(data);
          break;
        case 'UPDATE_AVAILABLE':
          setPwaStatus(prev => ({ ...prev, hasUpdate: true }));
          break;
        case 'CACHE_UPDATED':
          toast({
            title: "تحديث التطبيق",
            description: "تم تحديث التطبيق بنجاح",
            duration: 3000
          });
          break;
      }
    };

    // App installed event
    const handleAppInstalled = () => {
      setPwaStatus(prev => ({ ...prev, isInstalled: true }));
      toast({
        title: "تم تثبيت التطبيق!",
        description: "يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية",
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  };

  const cleanup = () => {
    // Any cleanup logic
  };

  // Queue management
  const loadSyncQueue = (): SyncQueueItem[] => {
    try {
      const stored = localStorage.getItem('offline-queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveSyncQueue = (queue: SyncQueueItem[]) => {
    localStorage.setItem('offline-queue', JSON.stringify(queue));
    setPwaStatus(prev => ({ ...prev, queuedOperations: queue.length }));
  };

  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    const updatedQueue = [...syncQueue, newItem];
    setSyncQueue(updatedQueue);
    saveSyncQueue(updatedQueue);

    toast({
      title: "تم حفظ العملية",
      description: "سيتم تنفيذ العملية عند عودة الاتصال",
      duration: 3000
    });
  }, [syncQueue, toast]);

  const processSyncQueue = useCallback(async () => {
    if (!pwaStatus.isOnline || syncQueue.length === 0) return;

    setPwaStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Process items in batches
      const BATCH_SIZE = 5;
      const batches = [];
      
      for (let i = 0; i < syncQueue.length; i += BATCH_SIZE) {
        batches.push(syncQueue.slice(i, i + BATCH_SIZE));
      }

      let successCount = 0;
      let failureCount = 0;

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(async (item) => {
            try {
              await syncItem(item);
              successCount++;
              
              // Remove successful item from queue
              setSyncQueue(prev => prev.filter(qItem => qItem.id !== item.id));
            } catch (error) {
              console.error('[PWA Controller] Sync failed for item:', item, error);
              failureCount++;
              
              // Retry logic
              if (item.retries < 3) {
                setSyncQueue(prev => prev.map(qItem => 
                  qItem.id === item.id 
                    ? { ...qItem, retries: qItem.retries + 1 }
                    : qItem
                ));
              } else {
                // Remove after max retries
                setSyncQueue(prev => prev.filter(qItem => qItem.id !== item.id));
              }
            }
          })
        );
      }

      // Update queue in localStorage
      const updatedQueue = syncQueue.filter(item => 
        item.retries < 3 && !syncQueue.some(sItem => sItem.id === item.id)
      );
      saveSyncQueue(updatedQueue);

      setPwaStatus(prev => ({ 
        ...prev, 
        syncInProgress: false,
        lastSyncTime: Date.now()
      }));

      if (successCount > 0) {
        toast({
          title: "مزامنة البيانات",
          description: `تم مزامنة ${successCount} عملية بنجاح`,
          duration: 3000
        });
      }

      if (failureCount > 0) {
        toast({
          title: "تحذير مزامنة",
          description: `فشل في مزامنة ${failureCount} عملية`,
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('[PWA Controller] Sync processing failed:', error);
      setPwaStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [pwaStatus.isOnline, syncQueue, toast]);

  const syncItem = async (item: SyncQueueItem): Promise<void> => {
    // This would be implemented based on your API structure
    const response = await fetch(`/api/${item.type}s`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync ${item.type}: ${response.statusText}`);
    }
  };

  const handleSyncSuccess = (data: any) => {
    toast({
      title: "مزامنة ناجحة",
      description: `تم مزامنة ${data.count} عنصر من نوع ${data.tag}`,
      duration: 3000
    });
  };

  const handleSyncFailed = (data: any) => {
    toast({
      title: "فشل المزامنة",
      description: `فشل في مزامنة بعض العناصر من نوع ${data.tag}`,
      variant: "destructive",
      duration: 5000
    });
  };

  // Notification management
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "الإشعارات غير مدعومة",
        description: "متصفحك لا يدعم الإشعارات",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPwaStatus(prev => ({ ...prev, notificationPermission: permission }));

      if (permission === 'granted') {
        toast({
          title: "تم تفعيل الإشعارات",
          description: "ستتلقى إشعارات مهمة حول نشاط التطبيق",
          duration: 5000
        });

        // Subscribe to push notifications if service worker is ready
        if (pwaStatus.serviceWorkerReady) {
          subscribeToPushNotifications();
        }
      } else {
        toast({
          title: "تم رفض الإشعارات",
          description: "يمكنك تفعيلها لاحقاً من إعدادات المتصفح",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[PWA Controller] Notification request failed:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // This would be implemented with your push notification service
      console.log('[PWA Controller] Subscribing to push notifications...');
    } catch (error) {
      console.error('[PWA Controller] Push subscription failed:', error);
    }
  };

  // Manual sync trigger
  const triggerManualSync = async () => {
    if (!pwaStatus.isOnline) {
      toast({
        title: "لا يوجد اتصال",
        description: "تحتاج لاتصال بالإنترنت للمزامنة",
        variant: "destructive"
      });
      return;
    }

    await processSyncQueue();
  };

  // Clear cache
  const clearAppCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.active?.postMessage({ type: 'CLEAR_CACHE' });
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);

          toast({
            title: "مسح ذاكرة التخزين",
            description: "سيتم إعادة تحميل التطبيق...",
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('[PWA Controller] Cache clear failed:', error);
    }
  };

  // Status indicator component
  const StatusIndicator = () => (
    <div className="fixed bottom-4 right-4 z-40">
      <Card className="w-64" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>حالة التطبيق</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>الاتصال</span>
            <div className="flex items-center gap-1">
              {pwaStatus.isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">منقطع</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span>التثبيت</span>
            <div className="flex items-center gap-1">
              {pwaStatus.isInstalled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">مثبت</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">متصفح</span>
                </>
              )}
            </div>
          </div>

          {pwaStatus.queuedOperations > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>في الانتظار</span>
              <Badge variant="secondary">
                {pwaStatus.queuedOperations} عملية
              </Badge>
            </div>
          )}

          {showAdvancedControls && (
            <div className="pt-2 space-y-2 border-t">
              {enableNotifications && pwaStatus.notificationPermission !== 'granted' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestNotificationPermission}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 ml-2" />
                  تفعيل الإشعارات
                </Button>
              )}

              {pwaStatus.queuedOperations > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={triggerManualSync}
                  disabled={!pwaStatus.isOnline || pwaStatus.syncInProgress}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 ml-2 ${pwaStatus.syncInProgress ? 'animate-spin' : ''}`} />
                  مزامنة يدوية
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={clearAppCache}
                className="w-full"
              >
                مسح ذاكرة التخزين
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Smart Install Banner */}
      {enableSmartBanner && !pwaStatus.isInstalled && (
        <SmartInstallBanner
          position={bannerPosition}
          theme={bannerTheme}
          showOnPages={showOnPages}
          minEngagementScore={10}
        />
      )}

      {/* Enhanced Install Prompt */}
      {enableEnhancedPrompt && !pwaStatus.isInstalled && (
        <EnhancedInstallPrompt />
      )}

      {/* Update Prompt */}
      {pwaStatus.hasUpdate && <UpdatePrompt />}

      {/* Offline Indicator */}
      {!pwaStatus.isOnline && <OfflineIndicator />}

      {/* Status Indicator (only in development or when advanced controls are needed) */}
      {(process.env.NODE_ENV === 'development' || showAdvancedControls) && (
        <StatusIndicator />
      )}

      {/* Expose PWA functions globally for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.PWAController = {
                status: ${JSON.stringify(pwaStatus)},
                queue: ${JSON.stringify(syncQueue)},
                sync: ${triggerManualSync.toString()},
                clearCache: ${clearAppCache.toString()}
              };
            `
          }}
        />
      )}
    </>
  );
};

// Export sync queue manager for use in other components
export const usePWASync = () => {
  const [controller, setController] = useState<any>(null);

  useEffect(() => {
    setController(window.PWAController);
  }, []);

  return {
    addToQueue: controller?.addToQueue,
    sync: controller?.sync,
    clearCache: controller?.clearCache,
    status: controller?.status
  };
}; 