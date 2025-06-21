import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const UpdatePrompt: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleStateChange = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        // New service worker is waiting to activate
        setRegistration(reg);
        setShowUpdatePrompt(true);
      }
    };

    // Check if there's already a waiting service worker
    navigator.serviceWorker.ready.then((reg) => {
      handleStateChange(reg);
      
      // Listen for future updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleStateChange(reg);
            }
          });
        }
      });
    });

    // Listen for skip waiting message
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;
    
    setIsUpdating(true);
    
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // The controllerchange event will trigger a reload
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    
    // Show again after 1 hour
    setTimeout(() => {
      if (registration && registration.waiting) {
        setShowUpdatePrompt(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Available</h3>
                <p className="text-sm text-gray-600 mt-1">A new version of Al-Araf Rental is ready</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">What's new:</p>
            <ul className="space-y-1">
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Performance improvements</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Bug fixes and stability enhancements</span>
              </li>
              <li className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Updated offline capabilities</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Now
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
              disabled={isUpdating}
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Updates include important security fixes
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};