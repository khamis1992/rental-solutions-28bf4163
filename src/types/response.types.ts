import { AppError } from './error.types';

/**
 * Base result type for all operations that can succeed or fail
 */
export type Result<T> = SuccessResult<T> | ErrorResult<T>;

/**
 * Success result type
 */
export interface SuccessResult<T> {
  success: true;
  data: T;
  error: null;
  message?: string;
}

/**
 * Error result type
 */
export interface ErrorResult<T> {
  success: false;
  error: AppError;
  data: null;
  message?: string;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Auth result type for authentication operations
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  message?: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
  message?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Helper function to create a success result
 */
export function createSuccessResult<T>(data: T, message?: string): SuccessResult<T> {
  return {
    success: true,
    data,
    error: null,
    message
  };
}

/**
 * Helper function to create an error result
 */
export function createErrorResult<T>(error: AppError, message?: string): ErrorResult<T> {
  return {
    success: false,
    error,
    data: null,
    message: message || error.message
  };
}

/**
 * Type guard to check if a result is a success result
 */
export function isSuccessResult<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success === true;
}

/**
 * Type guard to check if a result is an error result
 */
export function isErrorResult<T>(result: Result<T>): result is ErrorResult<T> {
  return result.success === false;
}

/**
 * Helper to extract message from Result
 */
export function getResultMessage<T>(result: Result<T>): string {
  if (!result.success) {
    return result.message || result.error.message;
  }
  return result.message || 'Operation completed successfully';
} 