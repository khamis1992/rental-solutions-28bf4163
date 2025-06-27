
import React, { useEffect, useState } from 'react';
import { SmartInstallBanner } from './SmartInstallBanner';
import { UpdatePrompt } from './UpdatePrompt';
import { OfflineIndicator } from './OfflineIndicator';

interface PWAControllerProps {
  enableSmartBanner?: boolean;
  enableEnhancedPrompt?: boolean;
  enableUpdatePrompt?: boolean;
  enableNotifications?: boolean;
  enableOfflineSync?: boolean;
  bannerPosition?: 'top' | 'bottom' | 'floating';
  bannerTheme?: 'default' | 'premium' | 'minimal';
}

export const PWAController: React.FC<PWAControllerProps> = ({
  enableSmartBanner = true,
  enableUpdatePrompt = true,
  enableNotifications = true,
  enableOfflineSync = true,
  bannerPosition = 'top',
  bannerTheme = 'premium'
}) => {
  const [isBrowser, setIsBrowser] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Only run PWA features in browser environment
    if (typeof window === 'undefined') return;
    
    setIsBrowser(true);
    
    // Check if app is already installed
    const checkInstalled = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true ||
                       localStorage.getItem('pwa-installed') === 'true';
      setIsInstalled(installed);
    };

    checkInstalled();

    // Listen for installation events
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    // Enhanced PWA features initialization
    if (enableNotifications && 'Notification' in window) {
      // Request notification permission after user interaction
      const requestNotificationPermission = async () => {
        if (Notification.permission === 'default') {
          setTimeout(async () => {
            try {
              const permission = await Notification.requestPermission();
              console.log('Notification permission:', permission);
            } catch (error) {
              console.log('Notification permission request failed:', error);
            }
          }, 10000); // Wait 10 seconds before asking
        }
      };

      // Request permissions after user engagement
      document.addEventListener('click', requestNotificationPermission, { once: true });
    }

    // Background sync setup
    if (enableOfflineSync && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Setup background sync
        if ('sync' in registration) {
          console.log('Background sync supported');
        }
      });
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, [enableNotifications, enableOfflineSync]);

  // Don't render PWA components during SSR or if already installed
  if (!isBrowser) {
    return null;
  }

  return (
    <>
      {/* Offline Indicator - Always show */}
      <OfflineIndicator />

      {/* Smart Install Banner - Only show if not installed */}
      {enableSmartBanner && !isInstalled && (
        <SmartInstallBanner 
          position={bannerPosition}
          theme={bannerTheme}
          minEngagementScore={1}
        />
      )}

      {/* Update Prompt - Handle app updates */}
      {enableUpdatePrompt && (
        <UpdatePrompt />
      )}
    </>
  );
};
