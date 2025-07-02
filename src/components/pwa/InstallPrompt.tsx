import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, Plus, Info } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

const isMobile = () => {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// PWA Debug utility for development
const logPWAStatus = () => {
  if (import.meta.env.DEV) {
    console.group('PWA Debug Info');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is iOS:', isIOS());
    console.log('Is Android:', isAndroid());
    console.log('Is Mobile:', isMobile());
    console.log('Is Standalone:', isInStandaloneMode());
    console.log('Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
    console.log('Service Worker Support:', 'serviceWorker' in navigator);
    console.log('PWA Install Support:', 'beforeinstallprompt' in window);
    console.log('Can Install PWA:', (window as any).canInstallPWA || false);
    console.log('Deferred Prompt Available:', !!(window as any).deferredPrompt);
    console.groupEnd();
  }
};

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    logPWAStatus();

    // Check if already installed
    if (isInStandaloneMode() || (window as any).isPWAInstalled) {
      setIsInstalled(true);
      return;
    }

    // Track visit count
    const visits = parseInt(localStorage.getItem('pwa-visit-count') || '0');
    const newVisitCount = visits + 1;
    setVisitCount(newVisitCount);
    localStorage.setItem('pwa-visit-count', newVisitCount.toString());

    // Check localStorage for dismissal
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show prompt again after 1 day for mobile users, 3 days for desktop
    const daysToWait = isMobile() ? 1 : 3;
    if (dismissed && daysSinceDismissed < daysToWait) {
      return;
    }

    // Listen for PWA install availability event from main.tsx
    const handlePWAInstallAvailable = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('PWA install event received:', customEvent.detail);
      setDeferredPrompt(customEvent.detail);
      
      // Show prompt after a short delay for better UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    // For iOS devices, show manual install instructions
    if (isIOS()) {
      // Show iOS prompt after 1 visit or 15 seconds on first visit
      if (newVisitCount >= 1) {
        const showTimeout = newVisitCount === 1 ? 15000 : 3000;
        setTimeout(() => {
          setShowIOSPrompt(true);
        }, showTimeout);
      }
    } else {
      // For Android/Chrome - listen for install availability
      window.addEventListener('pwa-install-available', handlePWAInstallAvailable);
      
      // Check if install is already available from main.tsx
      if ((window as any).canInstallPWA && (window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
      
      // Fallback for browsers that don't support beforeinstallprompt but are PWA capable
      if (isAndroid() && !deferredPrompt && isMobile() && newVisitCount >= 2) {
        setTimeout(() => {
          if (!isInstalled) {
            console.log('Showing fallback install prompt for Android');
            setShowPrompt(true);
          }
        }, 10000);
      }
    }

    // Debug: Show install prompt in development after 3 seconds regardless
    if (process.env.NODE_ENV === 'development' && isMobile()) {
      setTimeout(() => {
        if (!isInstalled) {
          if (isIOS()) {
            setShowIOSPrompt(true);
          } else {
            setShowPrompt(true);
          }
        }
      }, 3000);
    }

    const handleAppInstalled = () => {
      console.log('App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setShowIOSPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-visit-count');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handlePWAInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      // Try the global install function first
      if ((window as any).installPWA) {
        const success = await (window as any).installPWA();
        if (success) {
          setShowPrompt(false);
          setIsInstalling(false);
          return;
        }
      }

      // Fallback to direct prompt if available
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`Install prompt result: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowPrompt(false);
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
      } else {
        // Final fallback with instructions
        const instructions = isAndroid() 
          ? 'لإضافة التطبيق إلى الشاشة الرئيسية:\n1. اضغط على قائمة المتصفح (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"'
          : 'لإضافة التطبيق، استخدم خيار "إضافة إلى الشاشة الرئيسية" في متصفحك';
        
        alert(instructions);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error during installation:', error);
      alert('حدث خطأ أثناء التثبيت. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleIOSInstall = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled) {
    return null;
  }

  // Debug info panel (only in development)
  if (showDebugInfo && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg text-xs">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold">PWA Debug Info</h4>
          <button onClick={() => setShowDebugInfo(false)}>×</button>
        </div>
        <div className="space-y-1">
          <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          <p>iOS: {isIOS() ? 'Yes' : 'No'}</p>
          <p>Android: {isAndroid() ? 'Yes' : 'No'}</p>
          <p>Mobile: {isMobile() ? 'Yes' : 'No'}</p>
          <p>Standalone: {isInStandaloneMode() ? 'Yes' : 'No'}</p>
          <p>Visit Count: {visitCount}</p>
          <p>Deferred Prompt: {deferredPrompt ? 'Available' : 'Not Available'}</p>
          <p>Can Install: {(window as any).canInstallPWA ? 'Yes' : 'No'}</p>
          <p>Is Installing: {isInstalling ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  // iOS Install Instructions
  if (showIOSPrompt && isIOS()) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6" dir="rtl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">تثبيت تطبيق العراف</h3>
                  <p className="text-sm text-gray-600 mt-1">إضافة سريعة للشاشة الرئيسية</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 flex-row-reverse">
                <Share className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">1. اضغط على زر المشاركة في أسفل الشاشة</p>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <Plus className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">2. اختر "إضافة إلى الشاشة الرئيسية"</p>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <Download className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">3. اضغط "إضافة" للتثبيت</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-blue-700 text-right">
                💡 بعد التثبيت، ستجد التطبيق في الشاشة الرئيسية ويمكن استخدامه بدون إنترنت
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleIOSInstall}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                فهمت
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
              >
                ليس الآن
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugInfo(true)}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Info className="w-3 h-3 inline mr-1" />
                Debug Info
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Android/Chrome Install Prompt
  if (showPrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6" dir="rtl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">تثبيت تطبيق العراف</h3>
                  <p className="text-sm text-gray-600 mt-1">وصول سريع من الشاشة الرئيسية</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isInstalling}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-gray-600">يعمل بدون إنترنت</p>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-gray-600">سريع وموثوق</p>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-gray-600">إشعارات فورية</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isInstalling ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جارٍ التثبيت...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 ml-2" />
                    تثبيت التطبيق
                  </>
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
                disabled={isInstalling}
              >
                ليس الآن
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              لا يحتاج متجر التطبيقات • يثبت في ثوانٍ
            </p>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugInfo(true)}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Info className="w-3 h-3 inline mr-1" />
                Debug Info
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};