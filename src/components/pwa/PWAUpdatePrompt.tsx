import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { errorLogger } from '@/lib/errors/error-logger';

export const PWAUpdatePrompt: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              setNewServiceWorker(newWorker);
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  setShowUpdatePrompt(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!newServiceWorker) return;

    setIsUpdating(true);
    
    try {
      // Tell the new service worker to skip waiting
      newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to become active
      await new Promise<void>((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve();
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });

      // Reload the page to use the new service worker
      window.location.reload();
      
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'PWAUpdatePrompt.handleUpdate',
        action: 'service_worker_update',
        timestamp: new Date().toISOString()
      });
      toast({
        title: isArabic ? 'فشل في التحديث' : 'Update Failed',
        description: isArabic ? 'حدث خطأ أثناء التحديث' : 'An error occurred during update',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // Show again after 1 hour
    setTimeout(() => {
      setShowUpdatePrompt(true);
    }, 60 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed top-4 left-4 right-4 z-50 md:max-w-md md:left-auto md:right-4"
        >
          <Card className="shadow-2xl border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {isArabic ? 'تحديث متوفر' : 'Update Available'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'إصدار جديد من التطبيق' : 'New version of the app'}
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
                  ? 'يحتوي هذا التحديث على تحسينات في الأداء وإصلاح الأخطاء'
                  : 'This update includes performance improvements and bug fixes'
                }
              </p>

              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-blue-500">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isArabic ? 'تحسينات الأداء' : 'Performance Improvements'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? 'تحميل أسرع وتجربة أفضل' : 'Faster loading and better experience'}
                  </p>
                </div>
              </div>

              <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 touch-friendly"
                  size="lg"
                >
                  {isUpdating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                      </motion.div>
                      {isArabic ? 'جاري التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {isArabic ? 'تحديث الآن' : 'Update Now'}
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
