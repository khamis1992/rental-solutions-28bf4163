import React, { useEffect, useState } from 'react';
import { SmartInstallBanner } from './SmartInstallBanner';
import { EnhancedInstallPrompt } from './EnhancedInstallPrompt';
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
  enableEnhancedPrompt = true,
  enableUpdatePrompt = true,
  enableNotifications = true,
  enableOfflineSync = true,
  bannerPosition = 'top',
  bannerTheme = 'premium'
}) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // Only run PWA features in browser environment
    setIsBrowser(typeof window !== 'undefined');
  }, []);

  // Don't render PWA components during SSR
  if (!isBrowser) {
    return null;
  }

  return (
    <>
      {/* Offline Indicator - Always show */}
      <OfflineIndicator />

      {/* Smart Install Banner - Main PWA installation prompt for mobile */}
      {enableSmartBanner && (
        <SmartInstallBanner 
          position={bannerPosition}
          theme={bannerTheme}
          minEngagementScore={1} // Very low threshold for immediate showing
        />
      )}

      {/* Enhanced Install Prompt - Alternative install method */}
      {enableEnhancedPrompt && (
        <EnhancedInstallPrompt />
      )}

      {/* Update Prompt - Handle app updates */}
      {enableUpdatePrompt && (
        <UpdatePrompt />
      )}
    </>
  );
};
