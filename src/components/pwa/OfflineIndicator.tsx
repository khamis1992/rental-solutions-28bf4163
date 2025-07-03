import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR
  const [isRetrying, setIsRetrying] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;
    
    setIsBrowser(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Show reconnected message for 2 seconds (shorter for mobile)
      setTimeout(() => {
        setShowReconnected(false);
      }, isMobile ? 2000 : 3000);
      
      // Less intrusive toast for mobile
      toast({
        title: isMobile ? "متصل" : "Back Online",
        description: isMobile ? "تم استعادة الاتصال" : "Your connection has been restored.",
        duration: isMobile ? 2000 : 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      
      // Only show toast for desktop, mobile indicator is sufficient
      if (!isMobile) {
        toast({
          title: "You're Offline",
          description: "Some features may be limited.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    // Listen for connection changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom connection event from service worker
    const handleConnectionChange = (event: CustomEvent) => {
      if (event.detail.online) {
        handleOnline();
      } else {
        handleOffline();
      }
    };
    
    window.addEventListener('connection-changed', handleConnectionChange as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connection-changed', handleConnectionChange as EventListener);
    };
  }, [toast]);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/manifest.json', { 
        cache: 'no-store',
        mode: 'no-cors' 
      });
      
      if (navigator.onLine) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't render anything during SSR or if online and not showing reconnected message
  if (!isBrowser || (isOnline && !showReconnected)) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: isMobile ? -10 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isMobile ? -10 : -20 }}
          className={`fixed z-50 text-white shadow-lg ${
            isMobile 
              ? 'bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-lg p-3' 
              : 'top-0 left-0 right-0 bg-red-500 py-3'
          }`}
        >
          <div className={isMobile ? '' : 'container mx-auto px-4'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <div className={isMobile ? 'text-sm' : ''}>
                  <p className="font-medium">{isMobile ? 'غير متصل' : 'You\'re offline'}</p>
                  {!isMobile && <p className="text-sm opacity-90">Check your internet connection</p>}
                </div>
              </div>
              <Button
                size={isMobile ? "xs" : "sm"}
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-white text-red-500 hover:bg-red-50 border-white text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    {isMobile ? 'جارٍ...' : 'Retrying...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {isMobile ? 'إعادة' : 'Retry'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      
      {showReconnected && (
        <motion.div
          key="reconnected"
          initial={{ opacity: 0, y: isMobile ? -10 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isMobile ? -10 : -20 }}
          className={`fixed z-50 text-white shadow-lg ${
            isMobile 
              ? 'bottom-4 left-4 right-4 bg-green-500/90 backdrop-blur-sm rounded-lg p-3' 
              : 'top-0 left-0 right-0 bg-green-500 py-3'
          }`}
        >
          <div className={isMobile ? '' : 'container mx-auto px-4'}>
            <div className="flex items-center gap-2">
              <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                {isMobile ? 'تم الاتصال' : 'Back online'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};