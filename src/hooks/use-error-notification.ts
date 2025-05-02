
import { useCallback } from 'react';
import { 
  showErrorNotification, 
  suppressNotification, 
  clearNotification, 
  clearAllNotifications 
} from '@/utils/notification/error-notification-manager';

/**
 * Hook for managing error notifications with anti-fatigue features
 * Provides methods to show, suppress, and clear error notifications
 */
export function useErrorNotification() {
  /**
   * Show an error notification with duplicate prevention
   */
  const showError = useCallback((title: string, options?: {
    description?: string;
    duration?: number;
    id?: string;
    action?: React.ReactNode;
  }) => {
    return showErrorNotification(title, options);
  }, []);

  /**
   * Suppress a notification for a period of time
   */
  const suppressError = useCallback((id: string, duration?: number) => {
    suppressNotification(id, duration);
  }, []);

  /**
   * Clear a specific notification
   */
  const clearError = useCallback((id: string) => {
    clearNotification(id);
  }, []);

  /**
   * Clear all active notifications
   */
  const clearAllErrors = useCallback(() => {
    clearAllNotifications();
  }, []);

  return {
    showError,
    suppressError,
    clearError,
    clearAllErrors
  };
}
