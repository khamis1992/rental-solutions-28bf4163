
import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartInstallBannerProps {
  position?: 'top' | 'bottom' | 'floating';
  theme?: 'default' | 'premium' | 'minimal';
  minEngagementScore?: number;
}

export const SmartInstallBanner: React.FC<SmartInstallBannerProps> = ({
  position = 'top',
  theme = 'premium',
  minEngagementScore = 3
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installMethod, setInstallMethod] = useState<'prompt' | 'manual' | 'ios'>('manual');
  const [engagementScore, setEngagementScore] = useState(0);

  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) return; // Already installed

    // Check dismissal history
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    if (dismissed && daysSinceDismissed < 7) return;

    // Track user engagement
    const trackEngagement = () => {
      setEngagementScore(prev => prev + 1);
    };

    // Add engagement listeners
    document.addEventListener('click', trackEngagement);
    document.addEventListener('scroll', trackEngagement);
    window.addEventListener('focus', trackEngagement);

    // Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallMethod('prompt');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleBeforeInstallPrompt);

    // Show banner logic
    const showBannerTimer = setTimeout(() => {
      if (engagementScore >= minEngagementScore) {
        if (isIOS) {
          setInstallMethod('ios');
        } else if (deferredPrompt) {
          setInstallMethod('prompt');
        } else {
          setInstallMethod('manual');
        }
        setShowBanner(true);
      }
    }, 3000); // Show after 3 seconds

    return () => {
      clearTimeout(showBannerTimer);
      document.removeEventListener('click', trackEngagement);
      document.removeEventListener('scroll', trackEngagement);
      window.removeEventListener('focus', trackEngagement);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [engagementScore, minEngagementScore, isStandalone, isIOS, deferredPrompt]);

  const handleInstall = async () => {
    if (installMethod === 'prompt' && deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setShowBanner(false);
          localStorage.setItem('pwa-installed', 'true');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install failed:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    let instructions = '';
    
    if (isIOS) {
      instructions = `لتثبيت التطبيق على جهاز آيفون/آيباد:

1. اضغط على زر المشاركة (⬆️) في أسفل الشاشة
2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"
3. اضغط "إضافة" لإكمال التثبيت

ملاحظة: يجب استخدام متصفح Safari`;
    } else if (isMobile) {
      instructions = `لتثبيت التطبيق:

1. اضغط على قائمة المتصفح (⋮)
2. اختر "إضافة إلى الشاشة الرئيسية"
3. اتبع التعليمات لإكمال التثبيت`;
    } else {
      instructions = `لتثبيت التطبيق على الكمبيوتر:

1. ابحث عن أيقونة التثبيت في شريط العنوان
2. أو استخدم قائمة المتصفح واختر "تثبيت التطبيق"
3. اتبع التعليمات لإكمال التثبيت`;
    }
    
    alert(instructions);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || !isMobile) return null;

  const BannerContent = () => (
    <div className="flex items-center justify-between p-4 gap-4" dir="rtl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-full ${
          theme === 'premium' ? 'bg-white/20' : 'bg-blue-100'
        }`}>
          {isIOS ? (
            <Apple className="w-5 h-5 text-current" />
          ) : (
            <Smartphone className="w-5 h-5 text-current" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">تطبيق العراف للتأجير</p>
          <p className={`text-xs truncate ${
            theme === 'premium' ? 'text-white/80' : 'text-gray-600'
          }`}>
            للحصول على تجربة أفضل، ثبت التطبيق
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button 
          onClick={handleInstall}
          size="sm"
          className={
            theme === 'premium' 
              ? "bg-white text-blue-600 hover:bg-gray-100" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        >
          <Download className="w-4 h-4 ml-1" />
          تثبيت
        </Button>
        <button 
          onClick={handleDismiss}
          className={`p-1 rounded ${
            theme === 'premium' 
              ? 'text-white/60 hover:text-white' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const bannerPositionClass = {
    top: 'top-0',
    bottom: 'bottom-0',
    floating: 'bottom-4 left-4 right-4'
  }[position];

  const bannerBaseClass = position === 'floating' 
    ? 'fixed z-50 mx-auto max-w-md left-1/2 transform -translate-x-1/2'
    : 'fixed left-0 right-0 z-50';

  if (position === 'floating') {
    return (
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`${bannerBaseClass} ${bannerPositionClass}`}
          >
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <BannerContent />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          className={`${bannerBaseClass} ${bannerPositionClass} ${
            theme === 'premium' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
              : 'bg-white border-b shadow-sm'
          }`}
        >
          <BannerContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
