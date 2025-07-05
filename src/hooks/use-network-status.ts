import { useState, useEffect, useCallback } from 'react';
import { showOfflineToast, showSuccessToast, dismissToast } from '../utils/toast-utils';

interface UseNetworkStatusResult {
  isOnline: boolean;
  checkConnection: () => boolean;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    dismissToast('offline-toast');
    showSuccessToast('Back online', 'Your connection has been restored.');
  }, []);
  
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    showOfflineToast();
  }, []);
  
  const checkConnection = useCallback(() => {
    const online = navigator.onLine;
    setIsOnline(online);
    return online;
  }, []);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);
  
  return { isOnline, checkConnection };
}
