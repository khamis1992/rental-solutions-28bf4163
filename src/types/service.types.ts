import { PostgrestError } from '@supabase/supabase-js';
import { AppError, isAppError } from '@/types/error.types';

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | Error | null;
  message?: string;
}

export type ServiceResult<T> = ServiceResponse<T>;

// Type guard for service results
export function isServiceError<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: string | Error } {
  return !result.success && !!result.error;
}

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

// Helper to extract message from ServiceResult
export function getServiceMessage<T>(result: ServiceResult<T>): string {
  if (result.message) return result.message;
  if (result.error) return getErrorMessage(result.error);
  return 'Operation completed';
}
