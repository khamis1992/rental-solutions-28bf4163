// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useToast } from '@/hooks/use-toast';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR
  const [isRetrying, setIsRetrying] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;
    
    setIsBrowser(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Show reconnected message for 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      
      toast({
        title: "Back Online",
        description: "Your connection has been restored.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      
      toast({
        title: "You're Offline",
        description: "Some features may be limited.",
        variant: "destructive",
        duration: 5000,
      });
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5" />
                <div>
                  <p className="font-medium">You're offline</p>
                  <p className="text-sm opacity-90">Check your internet connection</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-white text-red-500 hover:bg-red-50 border-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5" />
              <p className="font-medium">Back online</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};