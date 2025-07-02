import { 
  AppError, 
  isAppError, 
  createApiError,
  createServiceError,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createPaymentError,
  ErrorContext,
  ErrorSeverity,
  ErrorDetails,
  ServiceError,
  DatabaseError,
  ValidationError,
  NotFoundError,
  ApiError,
  PaymentError
} from '@/types/error.types';

/**
 * Error logging context with enhanced details
 */
export interface ErrorLogContext extends ErrorContext {
  source?: string;
  operation?: string;
  context?: string;
  details?: Record<string, unknown>;
  stackTrace?: boolean;
  userId?: string;
  requestId?: string;
  timestamp?: string;
  environment?: string;
  component?: string;
  method?: string;
  params?: Record<string, unknown>;
  response?: unknown;
}

/**
 * Centralized error logging utility
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment: boolean;
  private defaultContext: Partial<ErrorLogContext>;

  private constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.defaultContext = {
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      stackTrace: this.isDevelopment
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Set default context for all error logs
   */
  public setDefaultContext(context: Partial<ErrorLogContext>): void {
    this.defaultContext = {
      ...this.defaultContext,
      ...context
    };
  }

  /**
   * Log an error with consistent formatting and enhanced context
   */
  public logError(
    error: unknown,
    severity: ErrorSeverity = 'medium',
    context?: ErrorLogContext
  ): void {
    const appError = this.toAppError(error);
    const mergedContext = this.mergeContext(context);
    const logMessage = this.formatLogMessage(appError, mergedContext);
    const logDetails = this.getLogDetails(appError, mergedContext);

    // Log to console with appropriate level based on severity
    switch (severity) {
      case 'critical':
        console.error('🔴 CRITICAL ERROR:', logMessage, logDetails);
        break;
      case 'high':
        console.error('🔴 HIGH SEVERITY ERROR:', logMessage, logDetails);
        break;
      case 'medium':
        console.warn('🟡 MEDIUM SEVERITY ERROR:', logMessage, logDetails);
        break;
      case 'low':
        console.info('🔵 LOW SEVERITY ERROR:', logMessage, logDetails);
        break;
    }

    // For critical errors, implement additional notification logic here
    if (severity === 'critical') {
      this.handleCriticalError(appError, mergedContext);
    }
  }

  /**
   * Convert any error to AppError format with enhanced details
   */
  private toAppError(error: unknown): AppError {
    if (isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      const errorDetails: ErrorDetails = {
        stack: error.stack,
        name: error.name,
        ...(error as any).cause && { cause: (error as any).cause }
      };

      // Handle specific error types based on error name
      switch (error.name) {
        case 'ServiceError':
          return createServiceError(error.message, {
            service: 'error-logger',
            operation: 'logError',
            ...errorDetails
          });
        
        case 'DatabaseError':
          return createDatabaseError(error.message, {
            query: 'unknown',
            params: null,
            constraint: error.message
          });
        
        case 'ValidationError':
          return createValidationError(error.message, [{
            field: 'unknown',
            message: error.message
          }]);
        
        case 'NotFoundError':
          return createNotFoundError('resource', 'unknown');
        
        case 'ApiError':
          return createApiError(error.message, {
            endpoint: 'unknown',
            method: 'unknown',
            status: 500
          });
        
        case 'PaymentError':
          return createPaymentError(error.message, {
            paymentId: 'unknown',
            amount: 0,
            reason: error.message
          });
        
        default:
          return createApiError(error.message, {
            endpoint: 'unknown',
            method: 'unknown',
            status: 500
          });
      }
    }

    if (typeof error === 'string') {
      return createApiError(error, {
        endpoint: 'unknown',
        method: 'unknown',
        status: 500
      });
    }

    if (typeof error === 'object' && error !== null) {
      return createApiError('An unknown error occurred', {
        endpoint: 'unknown',
        method: 'unknown',
        status: 500
      });
    }

    return createApiError('An unknown error occurred', {
      endpoint: 'unknown',
      method: 'unknown',
      status: 500
    });
  }

  /**
   * Format log message with enhanced context
   */
  private formatLogMessage(error: AppError, context: ErrorLogContext): string {
    const parts: string[] = [];

    // Add environment and timestamp
    if (context.environment) {
      parts.push(`[${context.environment.toUpperCase()}]`);
    }

    // Add source and component
    if (context.source) {
      parts.push(`[${context.source}]`);
    }
    if (context.component) {
      parts.push(`[${context.component}]`);
    }

    // Add operation and method
    if (context.operation) {
      parts.push(`Operation: ${context.operation}`);
    }
    if (context.method) {
      parts.push(`Method: ${context.method}`);
    }

    // Add context and request info
    if (context.context) {
      parts.push(`Context: ${context.context}`);
    }
    if (context.requestId) {
      parts.push(`Request: ${context.requestId}`);
    }
    if (context.userId) {
      parts.push(`User: ${context.userId}`);
    }

    // Add error message and severity
    parts.push(`Error: ${error.message}`);
    parts.push(`Severity: ${error.severity}`);

    return parts.join(' | ');
  }

  /**
   * Get detailed log information with enhanced context
   */
  private getLogDetails(error: AppError, context: ErrorLogContext): Record<string, unknown> {
    const details: Record<string, unknown> = {
      code: error.code,
      details: error.details,
      context: context.details,
      timestamp: context.timestamp || new Date().toISOString(),
      environment: context.environment || this.defaultContext.environment,
      component: context.component,
      operation: context.operation,
      method: context.method,
      params: context.params,
      response: context.response,
      severity: error.severity,
      retryable: error.retryable
    };

    // Add stack trace in development or if explicitly requested
    if (context.stackTrace && error.originalError instanceof Error) {
      details.stack = error.originalError.stack;
    }

    // Add request tracking info if available
    if (context.requestId) {
      details.requestId = context.requestId;
    }
    if (context.userId) {
      details.userId = context.userId;
    }

    return details;
  }

  /**
   * Merge provided context with default context
   */
  private mergeContext(context?: ErrorLogContext): ErrorLogContext {
    const mergedContext: ErrorLogContext = {
      ...this.defaultContext,
      ...context
    };

    // Ensure required fields have default values
    mergedContext.timestamp = mergedContext.timestamp || new Date().toISOString();
    mergedContext.environment = mergedContext.environment || this.defaultContext.environment;
    mergedContext.stackTrace = mergedContext.stackTrace ?? this.defaultContext.stackTrace;

    return mergedContext;
  }

  /**
   * Handle critical errors with additional notifications
   */
  private handleCriticalError(error: AppError, context: ErrorLogContext): void {
    // TODO: Implement critical error // handling - removed unused variable// This could include:
    // - Sending notifications to // administrators - removed unused variable// - Creating incident // reports - removed unused variable// - Triggering // alerts - removed unused variable// - Notifying monitoring services
    console.error('CRITICAL ERROR HANDLING NEEDED:', {
      error,
      context
    });
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance(); 