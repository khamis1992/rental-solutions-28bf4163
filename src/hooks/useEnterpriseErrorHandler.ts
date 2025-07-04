import { useCallback } from 'react';
import { enterpriseLogger } from '@/utils/enterprise-logger';
import { monitoringService } from '@/utils/monitoring-service';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export function useEnterpriseErrorHandler() {
  const handleError = useCallback((error: Error, context?: ErrorContext) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    enterpriseLogger.error(error.message, {
      errorId,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    monitoringService.recordMetric('error_count', 1, {
      component: context?.component || 'unknown',
      action: context?.action || 'unknown',
      errorType: error.name
    });

    return errorId;
  }, []);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    context?: ErrorContext
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      const errorId = handleError(error as Error, context);
      throw new Error(`Operation failed (Error ID: ${errorId})`);
    }
  }, [handleError]);

  const handleFormError = useCallback((error: Error, formName: string) => {
    return handleError(error, {
      component: 'form',
      action: 'submit',
      additionalData: { formName }
    });
  }, [handleError]);

  const handleApiError = useCallback((error: Error, endpoint: string, method: string) => {
    return handleError(error, {
      component: 'api',
      action: 'request',
      additionalData: { endpoint, method }
    });
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    handleFormError,
    handleApiError
  };
}
