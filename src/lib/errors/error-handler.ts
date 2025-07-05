import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import {
  ApiError,
  ApiResponse,
  createErrorResponse,
  createSuccessResponse
} from '@/types/api.types';
import {
  AppError,
  ErrorCode,
  ErrorDetails,
  createServiceError,
  createDatabaseError,
  isAppError as isStandardAppError,
  ErrorContext,
  ErrorSeverity
} from '@/types/error.types';
import { errorLogger } from './error-logger';
import {
  isPostgrestError,
  toDatabaseError,
  isDataIntegrityError,
  isRetryableDatabaseError,
  isAuthenticationError,
  isSchemaError
} from './database-error-handler';

/**
 * Re-export the standardized AppError type guard
 */
export const isAppError = isStandardAppError;

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  context?: ErrorContext;
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  logError?: boolean;
}

/**
 * Default error handling options
 */
const DEFAULT_OPTIONS: Required<ErrorHandlingOptions> = {
  retryCount: 0,
  maxRetries: 3,
  retryDelay: 1000,
  showToast: true,
  logError: true,
  context: {}
};

/**
 * Determine error severity based on error type
 */
function determineErrorSeverity(error: unknown): ErrorSeverity {
  if (isPostgrestError(error)) {
    // Data integrity errors are high severity
    if (isDataIntegrityError(error)) {
      return 'high';
    }
    // Authentication errors are high severity
    if (isAuthenticationError(error)) {
      return 'high';
    }
    // Schema errors are high severity
    if (isSchemaError(error)) {
      return 'high';
    }
    // Retryable errors are medium severity
    if (isRetryableDatabaseError(error)) {
      return 'medium';
    }
    // Other database errors are medium severity
    return 'medium';
  }

  if (error instanceof Error) {
    // Network errors are medium severity as they might be temporary
    if (error.name === 'NetworkError') {
      return 'medium';
    }
    // Authentication errors are high severity
    if (error.name === 'AuthenticationError') {
      return 'high';
    }
    // Authorization errors are high severity
    if (error.name === 'AuthorizationError') {
      return 'high';
    }
    // Validation errors are low severity
    if (error.name === 'ValidationError') {
      return 'low';
    }
  }

  // Default to medium severity for unknown errors
  return 'medium';
}

/**
 * Convert any error to AppError with enhanced context
 */
export function toAppError(error: unknown, context?: ErrorContext): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error;
  }

  // Handle PostgrestError
  if (isPostgrestError(error)) {
    return toDatabaseError(error, context);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return createServiceError(error.message, {
      stack: error.stack,
      name: error.name,
      ...(error as any).cause && { cause: (error as any).cause }
    });
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createServiceError(error, { type: 'string' });
  }

  // Fallback for unknown error types
  return createServiceError('An unknown error occurred', {
    type: typeof error,
    value: String(error)
  });
}

/**
 * Get a user-friendly error message for PostgreSQL errors with enhanced context
 */
function getPostgrestErrorMessage(error: PostgrestError, context?: string): string {
  // Handle specific database errors with more user-friendly messages
  switch (error.code) {
    case '23505':
      return 'A record with this information already exists.';
    case '23503':
      return 'This record cannot be modified because it is referenced by other data.';
    case '42P01':
      return 'Database table not found. Please contact support.';
    case '42703':
      return 'Database column not found. Please contact support.';
    case '28000':
      return 'Authentication failed. Please try signing in again.';
    case '40001':
      return 'Database is temporarily unavailable. Please try again.';
    case '57014':
      return 'Query timed out. Please try again with a simpler request.';
    case '23502':
      return 'Required field missing. Please check your form and try again.';
    case '22P02':
      return 'Invalid input format. Please check your data and try again.';
    case '22003':
      return 'Value out of range. Please check your input and try again.';
    default:
      return `${context ? context + ': ' : ''}Database error: ${error.message}`;
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handle errors with retry logic and consistent error handling
 */
export async function handleError<T>(
  error: unknown,
  options: ErrorHandlingOptions = {}
): Promise<ApiResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const appError = toAppError(error, opts.context);
  const severity = determineErrorSeverity(error);
  let errorMessage = appError.message;

  // Enhance error message for database errors
  if (isPostgrestError(error)) {
    errorMessage = getPostgrestErrorMessage(error, opts.context?.source);
  }

  // Log error if enabled
  if (opts.logError) {
    errorLogger.logError(error, severity, {
      ...opts.context,
      details: {
        code: appError.code,
        message: errorMessage,
        retryCount: opts.retryCount,
        maxRetries: opts.maxRetries
      }
    });
  }

  // Show toast if enabled
  if (opts.showToast) {
    toast({
      title: severity === 'critical' ? 'Critical Error' : 'Error',
      description: errorMessage,
      variant: severity === 'critical' ? 'destructive' : 'default',
    });
  }

  // Handle retry logic for retryable errors
  if (appError.retryable && opts.retryCount < opts.maxRetries) {
    await sleep(opts.retryDelay * (opts.retryCount + 1));
    return handleError(error, {
      ...opts,
      retryCount: opts.retryCount + 1
    });
  }

  return createErrorResponse(appError);
}

/**
 * Handle API success with consistent response format
 */
export function handleSuccess<T>(
  data: T,
  message?: string,
  context?: ErrorContext
): ApiResponse<T> {
  // Log success with context
  errorLogger.logError({ message: message || 'Operation completed successfully', data }, 'low', {
    ...context,
    details: { message, data }
  });

  // Show success toast
  toast({
    title: 'Success',
    description: message || 'Operation completed successfully',
    variant: 'default',
  });

  return createSuccessResponse(data);
}

/**
 * Execute an operation with error handling and retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const result = await operation();
    return handleSuccess(result, undefined, options.context);
  } catch (error) {
    return handleError(error, options);
  }
}

/**
 * Creates a detailed error with enhanced context
 */
export function createDetailedError(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
  context?: { source?: string; operation?: string }
): AppError {
  return {
    code,
    message,
    details,
    context,
    severity: 'medium',
    retryable: false
  };
}

/**
 * Determines if an error is retryable with enhanced context
 */
export function isRetryableError(error: unknown): boolean {
  const appError = toAppError(error);
  
  // Network errors are always retryable
  if (appError.code === 'NETWORK_ERROR') {
    return true;
  }
  
  // Service errors with specific status codes are retryable
  if (appError.code === 'SERVICE_ERROR') {
    const status = (appError.details as { status?: number })?.status;
    return (
      !status ||
      status === 408 ||
      status === 429 ||
      (status >= 500 && status < 600)
    );
  }
  
  // Database errors with specific codes are retryable
  if (appError.code === 'DATABASE_ERROR') {
    const dbError = appError.details as { constraint?: string };
    return (
      dbError.constraint === 'deadlock_detected' ||
      dbError.constraint === 'serialization_failure'
    );
  }
  
  return false;
} 