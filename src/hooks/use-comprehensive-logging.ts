/**
 * هوك شامل للتسجيل - يسهل استخدام نظام التسجيل في المكونات
 * Comprehensive Logging Hook - Easy to use logging system in components
 */

import { useCallback, useContext, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  comprehensiveLogger, 
  LogEntry, 
  LogLevel, 
  EventType, 
  EntityType 
} from '@/services/comprehensive-logging-service';

interface LoggingOptions {
  component?: string;
  operation?: string;
  source?: string;
  tags?: string[];
  skipConsole?: boolean;
  skipDatabase?: boolean;
}

interface TimedOperation {
  start: number;
  operation: string;
  component?: string;
}

export const useComprehensiveLogging = (defaultComponent?: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  // عمليات مؤقتة لقياس الأداء
  const timedOperations = useMemo(() => new Map<string, TimedOperation>(), []);

  /**
   * تسجيل حدث عام
   */
  const log = useCallback(async (
    level: LogLevel,
    message: string,
    eventType: EventType = 'system_operation',
    options: LoggingOptions & {
      entityType?: EntityType;
      entityId?: string;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
      error?: Error;
      durationMs?: number;
      status?: 'success' | 'warning' | 'error';
    } = {}
  ) => {
    const entry: LogEntry = {
      level,
      event_type: eventType,
      message,
      user_id: userId,
      component: options.component || defaultComponent,
      operation: options.operation,
      source: options.source,
      tags: options.tags,
      entity_type: options.entityType,
      entity_id: options.entityId,
      details: options.details,
      metadata: options.metadata,
      duration_ms: options.durationMs,
      status: options.status,
      error_stack: options.error?.stack
    };

    await comprehensiveLogger.log(entry);
  }, [userId, defaultComponent]);

  /**
   * تسجيل معلومات
   */
  const logInfo = useCallback(async (
    message: string, 
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('info', message, 'system_operation', { ...options, details });
  }, [log]);

  /**
   * تسجيل تحذير
   */
  const logWarn = useCallback(async (
    message: string, 
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('warn', message, 'system_operation', { ...options, details });
  }, [log]);

  /**
   * تسجيل خطأ
   */
  const logError = useCallback(async (
    message: string, 
    error?: Error,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('error', message, 'error', { 
      ...options, 
      details: { ...details, error: error?.message },
      error 
    });
  }, [log]);

  /**
   * تسجيل خطأ حرج
   */
  const logCritical = useCallback(async (
    message: string, 
    error?: Error,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('critical', message, 'error', { 
      ...options, 
      details: { ...details, error: error?.message },
      error 
    });
  }, [log]);

  /**
   * تسجيل إجراء المستخدم
   */
  const logUserAction = useCallback(async (
    action: string,
    entityType?: EntityType,
    entityId?: string,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('info', `User action: ${action}`, 'user_action', {
      ...options,
      operation: action,
      entityType,
      entityId,
      details
    });
  }, [log]);

  /**
   * تسجيل عملية قاعدة البيانات
   */
  const logDatabaseOperation = useCallback(async (
    operation: string,
    table: string,
    success: boolean,
    durationMs?: number,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log(
      success ? 'info' : 'error',
      `Database ${operation} on ${table}`,
      'database_operation',
      {
        ...options,
        operation: `${operation}_${table}`,
        durationMs,
        status: success ? 'success' : 'error',
        details: {
          ...details,
          table,
          operation,
          success
        }
      }
    );
  }, [log]);

  /**
   * تسجيل استدعاء API
   */
  const logApiCall = useCallback(async (
    method: string,
    endpoint: string,
    statusCode: number,
    durationMs?: number,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    const success = statusCode >= 200 && statusCode < 400;
    await log(
      success ? 'info' : 'error',
      `API ${method} ${endpoint} - ${statusCode}`,
      'api_call',
      {
        ...options,
        operation: `${method}_${endpoint}`,
        durationMs,
        status: success ? 'success' : 'error',
        details: {
          ...details,
          method,
          endpoint,
          statusCode
        }
      }
    );
  }, [log]);

  /**
   * تسجيل عملية دفع
   */
  const logPaymentOperation = useCallback(async (
    operation: string,
    paymentId: string,
    amount?: number,
    success?: boolean,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log(
      success === false ? 'error' : 'info',
      `Payment ${operation}: ${paymentId}`,
      'payment',
      {
        ...options,
        operation,
        entityType: 'payment',
        entityId: paymentId,
        status: success === false ? 'error' : 'success',
        details: {
          ...details,
          amount,
          success
        }
      }
    );
  }, [log]);

  /**
   * تسجيل عملية صيانة
   */
  const logMaintenanceOperation = useCallback(async (
    operation: string,
    vehicleId: string,
    maintenanceType?: string,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('info', `Maintenance ${operation}: ${vehicleId}`, 'maintenance', {
      ...options,
      operation,
      entityType: 'maintenance',
      entityId: vehicleId,
      details: {
        ...details,
        vehicleId,
        maintenanceType
      }
    });
  }, [log]);

  /**
   * تسجيل عملية قانونية
   */
  const logLegalOperation = useCallback(async (
    operation: string,
    caseId?: string,
    caseType?: string,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log('info', `Legal ${operation}`, 'legal', {
      ...options,
      operation,
      entityType: 'legal_case',
      entityId: caseId,
      details: {
        ...details,
        caseType
      }
    });
  }, [log]);

  /**
   * تسجيل مصادقة
   */
  const logAuthentication = useCallback(async (
    action: string,
    success: boolean,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log(
      success ? 'info' : 'warn',
      `Authentication ${action}`,
      'authentication',
      {
        ...options,
        operation: action,
        status: success ? 'success' : 'error',
        details
      }
    );
  }, [log]);

  /**
   * تسجيل أمان
   */
  const logSecurity = useCallback(async (
    event: string,
    level: LogLevel = 'warn',
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    await log(level, `Security event: ${event}`, 'security', {
      ...options,
      operation: event,
      details
    });
  }, [log]);

  /**
   * بدء قياس الأداء
   */
  const startPerformanceTimer = useCallback((
    operation: string,
    component?: string
  ): string => {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    timedOperations.set(timerId, {
      start: performance.now(),
      operation,
      component: component || defaultComponent
    });
    return timerId;
  }, [timedOperations, defaultComponent]);

  /**
   * إنهاء قياس الأداء وتسجيل النتيجة
   */
  const endPerformanceTimer = useCallback(async (
    timerId: string,
    success: boolean = true,
    details?: Record<string, any>,
    options?: LoggingOptions
  ) => {
    const timedOp = timedOperations.get(timerId);
    if (!timedOp) {
      console.warn(`Performance timer ${timerId} not found`);
      return;
    }

    const duration = Math.round(performance.now() - timedOp.start);
    timedOperations.delete(timerId);

    await log(
      success ? 'info' : 'warn',
      `Performance: ${timedOp.operation} completed in ${duration}ms`,
      'performance',
      {
        ...options,
        operation: timedOp.operation,
        component: timedOp.component,
        durationMs: duration,
        status: success ? 'success' : 'warning',
        details: {
          ...details,
          duration,
          performance_category: duration > 1000 ? 'slow' : duration > 500 ? 'medium' : 'fast'
        }
      }
    );

    return duration;
  }, [timedOperations, log]);

  /**
   * قياس الأداء لدالة
   */
  const withPerformanceLogging = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: string,
    component?: string
  ): T => {
    return (async (...args: any[]) => {
      const timerId = startPerformanceTimer(operation, component);
      try {
        const result = await fn(...args);
        await endPerformanceTimer(timerId, true, { args: args.length });
        return result;
      } catch (error) {
        await endPerformanceTimer(timerId, false, { 
          args: args.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }) as T;
  }, [startPerformanceTimer, endPerformanceTimer]);

  /**
   * معالج الأخطاء العام
   */
  const withErrorLogging = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: string,
    component?: string
  ): T => {
    return (async (...args: any[]) => {
      try {
        const result = await fn(...args);
        await logInfo(`Operation ${operation} completed successfully`, { args: args.length }, {
          operation,
          component
        });
        return result;
      } catch (error) {
        await logError(
          `Operation ${operation} failed`,
          error instanceof Error ? error : new Error(String(error)),
          { args: args.length },
          { operation, component }
        );
        throw error;
      }
    }) as T;
  }, [logInfo, logError]);

  /**
   * إرسال تقرير أخطاء مجمع
   */
  const sendErrorReport = useCallback(async (
    errors: Error[],
    context: string,
    options?: LoggingOptions
  ) => {
    const errorSummary = errors.map(err => ({
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n')
    }));

    await logError(
      `Multiple errors in ${context} (${errors.length} errors)`,
      undefined,
      {
        errorCount: errors.length,
        errors: errorSummary,
        context
      },
      options
    );
  }, [logError]);

  return {
    // دوال التسجيل الأساسية
    log,
    logInfo,
    logWarn,
    logError,
    logCritical,

    // دوال التسجيل المتخصصة
    logUserAction,
    logDatabaseOperation,
    logApiCall,
    logPaymentOperation,
    logMaintenanceOperation,
    logLegalOperation,
    logAuthentication,
    logSecurity,

    // قياس الأداء
    startPerformanceTimer,
    endPerformanceTimer,
    withPerformanceLogging,

    // معالجة الأخطاء
    withErrorLogging,
    sendErrorReport,

    // معلومات السياق
    userId,
    defaultComponent
  };
}; 