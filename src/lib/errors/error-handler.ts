import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { 
  AppError,
  ErrorCode,
  ErrorDetails,
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createApiError,
  createServiceError,
  createPaymentError,
  isAppError as isStandardAppError
} from '@/types/error.types';
import { errorLogger } from './error-logger';

/**
 * Type guard for PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Re-export the standardized AppError type guard
 */
export const isAppError = isStandardAppError;

/**
 * Converts various error types to AppError with enhanced context
 */
export function toAppError(error: unknown, context?: { source?: string; operation?: string }): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error;
  }

  // Handle PostgrestError
  if (isPostgrestError(error)) {
    return createDatabaseError(error.message, {
      query: 'unknown',
      params: null,
      constraint: error.details
    });
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: { 
        stack: error.stack,
        name: error.name,
        ...(error as any).cause && { cause: (error as any).cause },
        source: context?.source,
        operation: context?.operation
      },
      originalError: error
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      details: { 
        type: 'string',
        source: context?.source,
        operation: context?.operation
      }
    };
  }

  // Fallback for unknown error types
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: {
      type: typeof error,
      value: String(error),
      source: context?.source,
      operation: context?.operation
    },
    originalError: error
  };
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
 * Handles API errors with appropriate UI feedback and detailed logging
 */
export function handleApiError(
  error: unknown, 
  context?: string,
  operation?: string,
  additionalContext?: Record<string, unknown>
): ApiResponse {
  const appError = toAppError(error, { source: 'API', operation });
  let errorMessage = appError.message;
  
  // Enhance error message for database errors
  if (isPostgrestError(error)) {
    errorMessage = getPostgrestErrorMessage(error, context);
  }
  
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  // Log error with enhanced context
  errorLogger.logError(error, 'error', {
    source: 'API',
    operation,
    context,
    details: {
      code: appError.code,
      message: errorMessage,
      ...additionalContext
    },
    stackTrace: true
  });
  
  // Show error toast
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
  
  return createErrorResponse(appError);
}

/**
 * Handles successful API operations with appropriate UI feedback
 */
export function handleApiSuccess(
  message: string, 
  details?: string,
  context?: Record<string, unknown>
): void {
  errorLogger.logError({ code: 'SUCCESS', message }, 'info', {
    source: 'API',
    details: { 
      message, 
      details,
      ...context
    }
  });
  
  toast({
    title: 'Success',
    description: message,
  });
}

/**
 * Creates a detailed error with enhanced context
 */
export function createDetailedError(
  message: string,
  context: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code: 'API_ERROR',
    message: `${context}: ${message}`,
    details: {
      ...details,
      source: context
    }
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
  
  // API errors with specific status codes are retryable
  if (appError.code === 'API_ERROR') {
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