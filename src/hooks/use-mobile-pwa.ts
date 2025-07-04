import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
  connection: {
    type: string;
    effectiveType: string;
    downlink?: number;
    rtt?: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface PWACapabilities {
  serviceWorker: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  webShare: boolean;
  deviceOrientation: boolean;
  vibration: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  fileSystem: boolean;
  clipboard: boolean;
  fullscreen: boolean;
}

interface PWAFeatures {
  installPrompt: any;
  isInstallable: boolean;
  isUpdateAvailable: boolean;
  notificationPermission: NotificationPermission;
}

export const useMobilePWA = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isPWA: false,
    isStandalone: false,
    orientation: 'portrait',
    screenSize: { width: 0, height: 0 },
    connection: { type: 'unknown', effectiveType: 'unknown' }
  });

  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    serviceWorker: false,
    backgroundSync: false,
    pushNotifications: false,
    webShare: false,
    deviceOrientation: false,
    vibration: false,
    geolocation: false,
    camera: false,
    microphone: false,
    fileSystem: false,
    clipboard: false,
    fullscreen: false
  });

  const [pwaFeatures, setPwaFeatures] = useState<PWAFeatures>({
    installPrompt: null,
    isInstallable: false,
    isUpdateAvailable: false,
    notificationPermission: 'default'
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [performanceScore, setPerformanceScore] = useState(100);

  // Detect device and browser capabilities
  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    const deviceInfo: DeviceInfo = {
      isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      isTablet: /ipad|android(?!.*mobile)/i.test(userAgent),
      isDesktop: !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      isIOS: /ipad|iphone|ipod/.test(userAgent),
      isAndroid: /android/i.test(userAgent),
      isPWA: standalone || isInWebAppiOS,
      isStandalone: standalone || isInWebAppiOS,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: getConnectionInfo()
    };

    // Add battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        deviceInfo.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging
        };
        setDeviceInfo(prev => ({ ...prev, battery: deviceInfo.battery }));
      });
    }

    // Add memory info if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      deviceInfo.memory = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
      };
    }

    setDeviceInfo(deviceInfo);
  }, []);

  // Get connection information
  const getConnectionInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    
    return { type: 'unknown', effectiveType: 'unknown' };
  };

  // Detect PWA capabilities
  const detectCapabilities = useCallback(() => {
    const caps: PWACapabilities = {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      webShare: 'share' in navigator,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      fileSystem: 'showOpenFilePicker' in window,
      clipboard: 'clipboard' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement
    };

    setCapabilities(caps);
  }, []);

  // PWA installation methods
  const installPWA = useCallback(async () => {
    if (pwaFeatures.installPrompt) {
      try {
        await pwaFeatures.installPrompt.prompt();
        const result = await pwaFeatures.installPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          console.log('PWA installed successfully');
          setPwaFeatures(prev => ({ ...prev, installPrompt: null, isInstallable: false }));
          return true;
        }
      } catch (error) {
        console.error('Installation failed:', error);
      }
    }
    return false;
  }, [pwaFeatures.installPrompt]);

  // Native-like features
  const vibrate = useCallback((pattern: number | number[]) => {
    if (capabilities.vibration) {
      navigator.vibrate(pattern);
    }
  }, [capabilities.vibration]);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200]
    };
    vibrate(patterns[type]);
  }, [vibrate]);

  const requestNotificationPermission = useCallback(async () => {
    if (capabilities.pushNotifications) {
      const permission = await Notification.requestPermission();
      setPwaFeatures(prev => ({ ...prev, notificationPermission: permission }));
      return permission;
    }
    return 'denied';
  }, [capabilities.pushNotifications]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (pwaFeatures.notificationPermission === 'granted') {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        dir: 'rtl',
        lang: 'ar',
        ...options
      });
    }
    return null;
  }, [pwaFeatures.notificationPermission]);

  const shareContent = useCallback(async (data: ShareData) => {
    if (capabilities.webShare) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
    return false;
  }, [capabilities.webShare]);

  const getCurrentLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (capabilities.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
    }
    return null;
  }, [capabilities.geolocation]);

  const capturePhoto = useCallback(async (): Promise<string | null> => {
    if (capabilities.camera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        return new Promise((resolve) => {
          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            stream.getTracks().forEach(track => track.stop());
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          });
        });
      } catch (error) {
        console.error('Camera capture failed:', error);
      }
    }
    return null;
  }, [capabilities.camera]);

  const enterFullscreen = useCallback(async () => {
    if (capabilities.fullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch (error) {
        console.error('Fullscreen failed:', error);
      }
    }
    return false;
  }, [capabilities.fullscreen]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        return true;
      } catch (error) {
        console.error('Exit fullscreen failed:', error);
      }
    }
    return false;
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      const firstPaint = navigation.responseStart - navigation.fetchStart;
      
      // Calculate performance score (0-100)
      let score = 100;
      if (loadTime > 3000) score -= 30;
      if (domContentLoaded > 1500) score -= 20;
      if (firstPaint > 1000) score -= 20;
      if (deviceInfo.memory && deviceInfo.memory.usedJSHeapSize > 50 * 1024 * 1024) score -= 15;
      if (deviceInfo.connection.effectiveType === '2g') score -= 15;
      
      setPerformanceScore(Math.max(0, score));
      
      return {
        loadTime,
        domContentLoaded,
        firstPaint,
        score
      };
    }
    
    return null;
  }, [deviceInfo]);

  // Screen orientation methods
  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape') => {
    if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
      try {
        await (screen.orientation as any).lock(orientation);
        return true;
      } catch (error) {
        console.error('Orientation lock failed:', error);
      }
    }
    return false;
  }, []);

  const unlockOrientation = useCallback(() => {
    if ('orientation' in screen && 'unlock' in (screen.orientation as any)) {
      (screen.orientation as any).unlock();
    }
  }, []);

  // Initialize hooks
  useEffect(() => {
    detectDevice();
    detectCapabilities();
    
    // Listen for network changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        setDeviceInfo(prev => ({
          ...prev,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }));
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaFeatures(prev => ({
        ...prev,
        installPrompt: e,
        isInstallable: true
      }));
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed
    const handleAppInstalled = () => {
      setPwaFeatures(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false
      }));
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check notification permission
    if ('Notification' in window) {
      setPwaFeatures(prev => ({
        ...prev,
        notificationPermission: Notification.permission
      }));
    }
    
    // Monitor performance
    if ('performance' in window) {
      setTimeout(() => {
        measurePerformance();
      }, 1000);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [detectDevice, detectCapabilities, measurePerformance]);

  return {
    // Device information
    deviceInfo,
    capabilities,
    pwaFeatures,
    isOnline,
    performanceScore,
    
    // PWA methods
    installPWA,
    requestNotificationPermission,
    showNotification,
    
    // Native-like features
    vibrate,
    hapticFeedback,
    shareContent,
    getCurrentLocation,
    capturePhoto,
    enterFullscreen,
    exitFullscreen,
    lockOrientation,
    unlockOrientation,
    
    // Performance
    measurePerformance,
    
    // Utility methods
    refresh: () => {
      detectDevice();
      detectCapabilities();
    }
  };
};