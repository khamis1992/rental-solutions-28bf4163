import React, { useEffect, useState } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAUpdatePrompt } from './PWAUpdatePrompt';
import { BackgroundSync } from './BackgroundSync';
import { useToast } from '@/hooks/use-toast';
import { errorLogger } from '@/lib/errors/error-logger';

export const PWAController: React.FC = () => {
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPromptDeferred, setInstallPromptDeferred] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check service worker support
    if ('serviceWorker' in navigator) {
      setIsServiceWorkerSupported(true);
      registerServiceWorker();
    }

    // Handle network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptDeferred(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed
    const handleAppInstalled = () => {
      toast({
        title: 'تم تثبيت التطبيق بنجاح',
        description: 'يمكنك الآن استخدام التطبيق من شاشة هاتفك الرئيسية',
        duration: 5000,
      });
      setInstallPromptDeferred(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      errorLogger.logInfo('Service Worker registered successfully', { 
        scope: registration.scope,
        updateViaCache: registration.updateViaCache 
      });

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              toast({
                title: 'تحديث متوفر',
                description: 'إصدار جديد من التطبيق متوفر',
                duration: 8000,
              });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'CACHE_UPDATED':
            toast({
              title: 'تم تحديث البيانات',
              description: 'تم تحديث البيانات المحفوظة',
              duration: 3000,
            });
            break;
          case 'SYNC_COMPLETED':
            toast({
              title: 'تمت المزامنة',
              description: `تم مزامنة ${data.count} عنصر بنجاح`,
              duration: 3000,
            });
            break;
          case 'SYNC_FAILED':
            toast({
              title: 'فشل في المزامنة',
              description: 'حدث خطأ أثناء المزامنة',
              variant: 'destructive',
              duration: 5000,
            });
            break;
        }
      });

    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'PWAController.registerServiceWorker',
        action: 'service_worker_registration'
      });
    }
  };

  // Performance monitoring
  useEffect(() => {
    if ('performance' in window) {
      // Monitor performance metrics
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            if (process.env.NODE_ENV === 'development') {
              errorLogger.logInfo('Navigation timing metrics', {
                loadComplete: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
                domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
                firstPaint: navigationEntry.responseStart - navigationEntry.fetchStart
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  // Device capabilities detection
  useEffect(() => {
    const detectCapabilities = () => {
      const capabilities = {
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        orientation: screen.orientation?.type || 'unknown',
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        battery: 'getBattery' in navigator,
        vibration: 'vibrate' in navigator,
        geolocation: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        notifications: 'Notification' in window,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        installPrompt: installPromptDeferred !== null
      };

      // Store capabilities for app usage
      localStorage.setItem('pwa-capabilities', JSON.stringify(capabilities));
      
      if (process.env.NODE_ENV === 'development') {
        errorLogger.logInfo('PWA Capabilities detected', capabilities);
      }
    };

    detectCapabilities();
    
    // Re-detect on orientation change
    const handleOrientationChange = () => {
      setTimeout(detectCapabilities, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [installPromptDeferred]);

  if (!isServiceWorkerSupported) {
    return null;
  }

  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <BackgroundSync isOnline={isOnline} />
    </>
  );
};
