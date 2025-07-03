/**
 * Hook شامل لإدارة Service Worker
 */

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdating: boolean;
  needsUpdate: boolean;
  error: string | null;
  registration: ServiceWorkerRegistration | null;
}

interface ServiceWorkerActions {
  updateServiceWorker: () => void;
  clearCache: () => void;
  skipWaiting: () => void;
  unregister: () => void;
}

export const useServiceWorker = (): ServiceWorkerState & ServiceWorkerActions => {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isUpdating: false,
    needsUpdate: false,
    error: null,
    registration: null
  });

  // تسجيل Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    try {
      console.log('🔄 Registering Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // تجنب التخزين المؤقت للـ SW
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null
      }));

      console.log('✅ Service Worker registered successfully');

      // مراقبة التحديثات
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          setState(prev => ({ ...prev, isUpdating: true }));
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ 
                ...prev, 
                needsUpdate: true, 
                isUpdating: false 
              }));
            }
          });
        }
      });

      // التعامل مع الرسائل من Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }));
    }
  }, []);

  // تحديث Service Worker
  const updateServiceWorker = useCallback(() => {
    if (state.registration && state.registration.waiting) {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      // إرسال رسالة للـ SW للتحديث
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // إعادة تحميل الصفحة بعد التحديث
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [state.registration]);

  // حذف الكاش
  const clearCache = useCallback(async () => {
    try {
      if (state.registration && state.registration.active) {
        state.registration.active.postMessage({ type: 'CACHE_CLEAR' });
        console.log('🧹 Cache clear request sent to Service Worker');
      } else {
        // حذف مباشر إذا لم يكن SW متاح
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 Cache cleared directly');
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }, [state.registration]);

  // تجاهل الانتظار والتحديث فوراً
  const skipWaiting = useCallback(() => {
    if (state.registration && state.registration.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, needsUpdate: false }));
    }
  }, [state.registration]);

  // إلغاء تسجيل Service Worker
  const unregister = useCallback(async () => {
    try {
      if (state.registration) {
        await state.registration.unregister();
        setState(prev => ({ 
          ...prev, 
          isRegistered: false, 
          registration: null 
        }));
        console.log('🗑️ Service Worker unregistered');
      }
    } catch (error) {
      console.error('❌ Failed to unregister Service Worker:', error);
    }
  }, [state.registration]);

  // تثبيت Service Worker عند تحميل الصفحة
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // مراقبة تحديثات Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      console.log('🔄 Service Worker controller changed');
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    skipWaiting,
    unregister
  };
};

// Hook مبسط للتحقق من Service Worker
export const useServiceWorkerStatus = () => {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        setIsReady(!!registration.active);
      }
    };

    checkServiceWorker();

    // مراقبة حالة الاتصال
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isReady, isOnline };
};

// Hook لمراقبة أداء التحميل
export const useLoadingPerformance = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0
  });

  useEffect(() => {
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: 0, // سيتم حسابه من PerformanceObserver
          largestContentfulPaint: 0
        });

        // مراقبة Paint Timing
        if ('PerformanceObserver' in window) {
          try {
            const paintObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                  setMetrics(prev => ({ ...prev, firstContentfulPaint: entry.startTime }));
                }
              });
            });
            paintObserver.observe({ entryTypes: ['paint'] });

            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              setMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }));
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            console.warn('Performance Observer not fully supported');
          }
        }
      }
    };

    // قياس الأداء بعد تحميل الصفحة
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return metrics;
};

export default useServiceWorker;
