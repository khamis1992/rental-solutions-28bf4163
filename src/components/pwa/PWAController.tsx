
import React from 'react';
import { SmartInstallBanner } from './SmartInstallBanner';
import { UpdatePrompt } from './UpdatePrompt';
import { EnhancedInstallPrompt } from './EnhancedInstallPrompt';
import { PWABanner } from './PWABanner';

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
  return (
    <>
      {/* Smart Install Banner - Main PWA installation prompt */}
      {enableSmartBanner && (
        <SmartInstallBanner 
          position={bannerPosition}
          theme={bannerTheme}
          minEngagementScore={10}
        />
      )}

      {/* Enhanced Install Prompt - Alternative install method */}
      {enableEnhancedPrompt && (
        <EnhancedInstallPrompt />
      )}

      {/* Simple PWA Banner - Fallback */}
      <PWABanner />

      {/* Update Prompt - Handle app updates */}
      {enableUpdatePrompt && (
        <UpdatePrompt />
      )}
    </>
  );
};
