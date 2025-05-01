
import { useEffect } from 'react';
import { useError, ErrorData } from '@/contexts/ErrorContext';

// Configuration interface
interface ErrorTelemetryConfig {
  shouldSendToService: boolean;
  includeUserInfo?: boolean;
  serviceName?: string;
  maxErrorsToStore?: number;
}

// Default configuration
const defaultConfig: ErrorTelemetryConfig = {
  shouldSendToService: false,
  includeUserInfo: false,
  serviceName: 'fleet-management',
  maxErrorsToStore: 50,
};

/**
 * Hook for handling error telemetry
 * Allows tracking and reporting errors to monitoring services
 */
export function useErrorTelemetry(config: Partial<ErrorTelemetryConfig> = {}) {
  const { errors } = useError();
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Store errors in localStorage for persistence
  useEffect(() => {
    if (errors.length > 0) {
      try {
        const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
        const updatedHistory = [
          ...errorHistory,
          ...errors.filter(e => !e.handled).map(sanitizeErrorForStorage)
        ].slice(-mergedConfig.maxErrorsToStore!);
        
        localStorage.setItem('error_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Failed to save error history to localStorage:', e);
      }
    }
  }, [errors, mergedConfig.maxErrorsToStore]);
  
  // Send errors to monitoring service
  useEffect(() => {
    if (!mergedConfig.shouldSendToService) return;
    
    const unhandledErrors = errors.filter(e => !e.handled);
    if (unhandledErrors.length === 0) return;
    
    unhandledErrors.forEach(error => {
      sendErrorToMonitoringService(error, mergedConfig);
    });
  }, [errors, mergedConfig]);
  
  // Get error history from localStorage
  const getErrorHistory = () => {
    try {
      return JSON.parse(localStorage.getItem('error_history') || '[]');
    } catch (e) {
      console.error('Failed to retrieve error history:', e);
      return [];
    }
  };
  
  // Clear error history
  const clearErrorHistory = () => {
    try {
      localStorage.removeItem('error_history');
    } catch (e) {
      console.error('Failed to clear error history:', e);
    }
  };
  
  return {
    errorCount: errors.length,
    getErrorHistory,
    clearErrorHistory,
  };
}

// Helper function to sanitize error data for storage
function sanitizeErrorForStorage(error: ErrorData) {
  // Remove any sensitive information
  const { meta, ...safeError } = error;
  
  // Only include safe metadata if any exists
  if (meta) {
    const safeMeta = { ...meta };
    delete safeMeta.token;
    delete safeMeta.password;
    delete safeMeta.authToken;
    delete safeMeta.sessionId;
    
    return {
      ...safeError,
      meta: Object.keys(safeMeta).length > 0 ? safeMeta : undefined
    };
  }
  
  return safeError;
}

// Helper function to send error to a monitoring service
function sendErrorToMonitoringService(error: ErrorData, config: ErrorTelemetryConfig) {
  // This is a placeholder. In a real app, you would send to Sentry, LogRocket, etc.
  console.log(`[TELEMETRY] Would send error to monitoring service:`, error);
  
  // Example of how to send to a service:
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(new Error(error.message), {
  //     tags: {
  //       severity: error.severity,
  //       category: error.category,
  //       source: error.source,
  //     },
  //     extra: {
  //       code: error.code,
  //       details: error.details,
  //       meta: error.meta,
  //     },
  //   });
  // }
}
