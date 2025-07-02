
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface EnhancedInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const EnhancedInstallPrompt: React.FC<EnhancedInstallPromptProps> = ({
  onInstall,
  onDismiss
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if running on mobile
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone) return;

    // Check if recently dismissed
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    if (dismissed && daysSinceDismissed < 3) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay on mobile
      if (isMobile) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // For mobile devices without native prompt support
    if (isMobile && !deferredPrompt) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isMobile, deferredPrompt, isStandalone]);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setShowPrompt(false);
          onInstall?.();
        }
        setDeferredPrompt(null);
      } else {
        // Show manual installation instructions
        showManualInstallInstructions();
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const showManualInstallInstructions = () => {
    const instructions = isIOS 
      ? 'للتثبيت على iOS:\n1. اضغط على زر المشاركة (↑)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"'
      : 'للتثبيت:\n1. اضغط على قائمة المتصفح (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
    
    alert(instructions);
    setShowPrompt(false);
    onInstall?.();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    onDismiss?.();
  };

  if (!showPrompt || !isMobile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50"
      >
        <Card className="shadow-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white" dir="rtl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-blue-900">
                    تثبيت التطبيق
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      مجاني
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      بدون إنترنت
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                احصل على تجربة أفضل مع التطبيق المثبت على جهازك
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1 text-green-600">
                  <Shield className="w-3 h-3" />
                  <span>آمن</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Zap className="w-3 h-3" />
                  <span>سريع</span>
                </div>
                <div className="flex items-center gap-1 text-purple-600">
                  <Star className="w-3 h-3" />
                  <span>محسن</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isInstalling ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جارٍ التثبيت...
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 ml-1" />
                      تثبيت
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="px-4"
                >
                  لاحقاً
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
