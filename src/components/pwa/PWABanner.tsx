import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const PWABanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;

  useEffect(() => {
    if (!isMobile || isStandalone) return;

    // Check if banner was dismissed recently
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    if (dismissed && daysSinceDismissed < 7) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Show banner for iOS or unsupported browsers after delay
    if (!deferredPrompt) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isMobile, isStandalone, deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
        }
      } catch (error) {
        console.error('Install failed:', error);
      }
    } else {
      // Manual installation for iOS
      alert('للتثبيت:\n1. اضغط زر المشاركة\n2. اختر "إضافة للشاشة الرئيسية"\n3. اضغط "إضافة"');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-full">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">تطبيق العراف للتأجير</p>
              <p className="text-xs text-blue-100">للحصول على تجربة أفضل، ثبت التطبيق</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleInstall}
              size="sm"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              <Download className="w-4 h-4 ml-1" />
              تثبيت
            </Button>
            <button 
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
