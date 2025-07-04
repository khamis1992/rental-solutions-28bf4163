import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Globe, Wifi, Zap, Lock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissedTime, setDismissedTime] = useState<number | null>(null);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      setIsInstalled(true);
      return;
    }

    // Check if prompt was recently dismissed
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissed) {
      const dismissedAt = parseInt(lastDismissed);
      const daysPassed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      
      if (daysPassed < 7) {
        setDismissedTime(dismissedAt);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after user has interacted with the app
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installed successfully');
        setIsInstalled(true);
        setShowPrompt(false);
      } else {
        console.log('PWA installation dismissed');
        handleDismiss();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const now = Date.now();
    localStorage.setItem('pwa-install-dismissed', now.toString());
    setDismissedTime(now);
  };

  // iOS Safari specific instructions
  const showIOSInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    return isIOS && isSafari;
  };

  const getFeatures = () => [
    {
      icon: <Zap className="w-5 h-5" />,
      title: isArabic ? 'تحميل فوري' : 'Instant Loading',
      description: isArabic ? 'تحميل سريع حتى بدون إنترنت' : 'Fast loading even offline'
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: isArabic ? 'يعمل بدون إنترنت' : 'Works Offline',
      description: isArabic ? 'استخدم التطبيق حتى بدون اتصال' : 'Use the app even without connection'
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: isArabic ? 'آمن ومحمي' : 'Secure & Protected',
      description: isArabic ? 'تشفير متقدم لحماية بياناتك' : 'Advanced encryption for your data'
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: isArabic ? 'تجربة أصلية' : 'Native Experience',
      description: isArabic ? 'تجربة مثل التطبيقات الأصلية' : 'Native app-like experience'
    }
  ];

  if (isInstalled) {
    return null;
  }

  if (dismissedTime && Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:max-w-md md:left-auto md:right-4"
        >
          <Card className="shadow-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {isArabic ? 'تثبيت التطبيق' : 'Install App'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'العراف لتأجير السيارات' : 'Al-Araf Car Rental'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'احصل على تجربة أفضل مع التطبيق المثبت على جهازك'
                  : 'Get the best experience with the app installed on your device'
                }
              </p>

              <div className="grid gap-3">
                {getFeatures().map((feature, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg bg-muted/50 ${isArabic ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="text-blue-500">
                      {feature.icon}
                    </div>
                    <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {showIOSInstructions() ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {isArabic ? 'للتثبيت على iOS:' : 'To install on iOS:'}
                  </p>
                  <ol className={`text-sm text-muted-foreground space-y-1 ${isArabic ? 'text-right' : ''}`}>
                    <li>1. {isArabic ? 'اضغط على زر المشاركة' : 'Tap the Share button'} 📤</li>
                    <li>2. {isArabic ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Choose "Add to Home Screen"'}</li>
                    <li>3. {isArabic ? 'اضغط "إضافة"' : 'Tap "Add"'}</li>
                  </ol>
                </div>
              ) : (
                <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={handleInstall}
                    disabled={isInstalling || !deferredPrompt}
                    className="flex-1 touch-friendly"
                    size="lg"
                  >
                    {isInstalling ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                        </motion.div>
                        {isArabic ? 'جاري التثبيت...' : 'Installing...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {isArabic ? 'تثبيت الآن' : 'Install Now'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    className="touch-friendly"
                    size="lg"
                  >
                    {isArabic ? 'لاحقاً' : 'Later'}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{isArabic ? 'آمن ومجاني' : 'Safe & Free'}</span>
                <Badge variant="secondary" className="text-xs">
                  PWA
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};