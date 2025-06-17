import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/pwa/notification-service';
import { backgroundSyncService } from '@/services/pwa/background-sync-service';
import { useToast } from '@/hooks/use-toast';

interface PWAStatus {
  isInstalled: boolean;
  isOffline: boolean;
  canInstall: boolean;
  notificationPermission: NotificationPermission;
  hasPendingSync: boolean;
  updateAvailable: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOffline: !navigator.onLine,
    canInstall: false,
    notificationPermission: 'default',
    hasPendingSync: false,
    updateAvailable: false
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
      setPwaStatus(prev => ({ ...prev, isInstalled }));
    };

    checkInstalled();
    
    // Listen for app installed event
    window.addEventListener('appinstalled', checkInstalled);
    return () => window.removeEventListener('appinstalled', checkInstalled);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: false }));
      backgroundSyncService.syncQueue();
    };

    const handleOffline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaStatus(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Handle service worker registration and updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg);
      
      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPwaStatus(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });
    });
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPwaStatus(prev => ({ 
        ...prev, 
        notificationPermission: Notification.permission 
      }));
    }
  }, []);

  // Check pending sync status
  useEffect(() => {
    const checkPendingSync = () => {
      const queueStatus = backgroundSyncService.getQueueStatus();
      setPwaStatus(prev => ({ 
        ...prev, 
        hasPendingSync: queueStatus.count > 0 
      }));
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation Not Available",
        description: "This app is already installed or installation is not supported.",
        variant: "destructive"
      });
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "App Installed",
          description: "Al-Araf Rental has been installed successfully!",
        });
        setPwaStatus(prev => ({ ...prev, canInstall: false, isInstalled: true }));
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast({
        title: "Installation Failed",
        description: "There was an error installing the app. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [deferredPrompt, toast]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    const permission = await notificationService.requestPermission();
    setPwaStatus(prev => ({ ...prev, notificationPermission: permission }));
    
    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive important updates and reminders.",
      });
      
      // Subscribe to push notifications
      await notificationService.subscribeToPushNotifications();
    } else if (permission === 'denied') {
      toast({
        title: "Notifications Blocked",
        description: "You can enable notifications in your browser settings.",
        variant: "destructive"
      });
    }
    
    return permission;
  }, [toast]);

  // Update PWA
  const updatePWA = useCallback(async () => {
    if (!registration || !registration.waiting) return;
    
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // The page will reload when the new service worker takes control
    toast({
      title: "Updating...",
      description: "The app is being updated to the latest version.",
    });
  }, [registration, toast]);

  // Sync offline data
  const syncOfflineData = useCallback(async () => {
    try {
      await backgroundSyncService.syncQueue();
      toast({
        title: "Sync Complete",
        description: "Your offline changes have been synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Add to offline queue
  const addToOfflineQueue = useCallback(async (
    type: 'payment' | 'agreement' | 'maintenance' | 'vehicle-status' | 'customer',
    action: 'create' | 'update' | 'delete',
    data: any
  ) => {
    await backgroundSyncService.addToQueue({ type, action, data });
    
    if (!navigator.onLine) {
      toast({
        title: "Saved Offline",
        description: "Your changes will be synced when you're back online.",
      });
    }
  }, [toast]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!('caches' in window)) return;
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      toast({
        title: "Cache Cleared",
        description: "The app cache has been cleared successfully.",
      });
      
      // Reload to fetch fresh content
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    ...pwaStatus,
    installPWA,
    requestNotificationPermission,
    updatePWA,
    syncOfflineData,
    addToOfflineQueue,
    clearCache,
    notificationService,
    backgroundSyncService
  };
};