import { AppError, isAppError } from '@/types/error.types';

/**
 * Log levels for error logging
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Error logging context with enhanced details
 */
export interface ErrorLogContext {
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
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.defaultContext = {
      environment: process.env.NODE_ENV,
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
    level: LogLevel = 'error',
    context?: ErrorLogContext
  ): void {
    const appError = this.toAppError(error);
    const mergedContext = this.mergeContext(context);
    const logMessage = this.formatLogMessage(appError, mergedContext);
    const logDetails = this.getLogDetails(appError, mergedContext);

    switch (level) {
      case 'error':
        console.error(logMessage, logDetails);
        break;
      case 'warn':
        console.warn(logMessage, logDetails);
        break;
      case 'info':
        console.info(logMessage, logDetails);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage, logDetails);
        }
        break;
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
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: {
          stack: error.stack,
          name: error.name,
          ...(error as any).cause && { cause: (error as any).cause }
        },
        originalError: error
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        details: { type: 'string' }
      };
    }

    if (typeof error === 'object' && error !== null) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: {
          type: 'object',
          value: JSON.stringify(error)
        },
        originalError: error
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: {
        type: typeof error,
        value: String(error)
      },
      originalError: error
    };
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

    // Add error message
    parts.push(`Error: ${error.message}`);

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
      environment: context.environment,
      component: context.component,
      operation: context.operation,
      method: context.method,
      params: context.params,
      response: context.response
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
    return {
      ...this.defaultContext,
      ...context,
      timestamp: context?.timestamp || this.defaultContext.timestamp,
      environment: context?.environment || this.defaultContext.environment,
      stackTrace: context?.stackTrace ?? this.defaultContext.stackTrace
    };
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance(); 