import React, { useState, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export const UpdatePrompt: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker update
    const handleSWUpdate = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        setShowUpdatePrompt(true);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWUpdate);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWUpdate);
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-80 shadow-lg" dir="rtl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  تحديث جديد متاح
                </h3>
                <p className="text-sm text-gray-600">
                  إصدار محسن من التطبيق جاهز للتثبيت
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1"
                size="sm"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جارٍ التحديث...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    تحديث الآن
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                disabled={isUpdating}
              >
                لاحقاً
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};