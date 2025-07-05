import { PostgrestError } from '@supabase/supabase-js';
import { AppError, Result, isAppError, ErrorContext } from '@/types/error.types';

/**
 * @deprecated Use Result<T> instead
 */
export type ServiceResponse<T> = Result<T>;

/**
 * Helper to extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    if (errorObj.error) {
      return getErrorMessage(errorObj.error);
    }
  }
  return 'An unknown error occurred';
}

/**
 * Helper to convert various error types to AppError
 */
export function toAppError(error: unknown, context?: ErrorContext): AppError {
  if (isAppError(error)) {
    return {
      ...error,
      context: context ? { ...error.context, ...context } : error.context
    };
  }
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      severity: 'medium',
      retryable: false,
      context
    };
  }
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      severity: 'medium',
      retryable: false,
      context
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    severity: 'medium',
    retryable: false,
    context
  };
}

/**
 * Helper to extract message from Result
 */
export function getResultMessage<T>(result: Result<T>): string {
  if (!result.success) {
    return result.error.message;
  }
  return 'Operation completed successfully';
}
