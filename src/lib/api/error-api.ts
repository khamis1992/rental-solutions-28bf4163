
import { toast } from '@/hooks/use-toast';
import { errorService } from '@/services/error/ErrorService';
import { PostgrestError } from '@supabase/supabase-js';
import { safeTransform } from '@/utils/error-handling';

/**
 * Unified error handling API that centralizes all error handling functionality
 */

/**
 * Get a categorized error message from any error type
 */
export function getCategorizedErrorMessage(error: unknown): {
  message: string;
  category: string;
  statusCode?: number;
} {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      category: 'unknown'
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      category: error.name === 'ValidationError' ? 'validation' : 'unknown'
    };
  }

  // Handle Postgrest/Supabase errors
  if (isPostgrestError(error)) {
    return {
      message: getPostgrestErrorMessage(error),
      category: 'database',
      statusCode: getStatusCodeFromPostgrestError(error)
    };
  }

  // Handle HTTP responses
  if (typeof error === 'object' && error !== null && 'status' in error && 'statusText' in error) {
    return {
      message: `HTTP Error: ${(error as any).statusText || 'Unknown HTTP error'}`,
      category: 'network',
      statusCode: (error as any).status
    };
  }

  // Default error handling
  return {
    message: 'An unexpected error occurred',
    category: 'unknown'
  };
}

/**
 * Handle API errors with appropriate UI feedback
 * This is the standardized error handling function that should be used across the application
 *
 * @param error - The error object from the API call
 * @param context - Optional context information for the error
 */
export function handleApiError(error: unknown, context?: string): void {
  // First log the error for debugging
  console.error('API Error:', error, context ? `Context: ${context}` : '');

  // Transform the error to a standardized format
  const errorInfo = safeTransform(
    error,
    getCategorizedErrorMessage,
    { message: 'An unexpected error occurred', category: 'unknown' }
  );

  // Add context to message if provided
  const message = context
    ? `${context}: ${errorInfo.message}`
    : errorInfo.message;

  // Use the error service to handle the error (this will show toast notifications)
  errorService.handleApiError({
    message,
    code: errorInfo.category,
    details: error instanceof Error ? error.stack : undefined
  }, context);
}

// Type guard for Postgrest errors
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Get a user-friendly message for Postgrest errors
 */
export function getPostgrestErrorMessage(error: PostgrestError): string {
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
    default:
      return `Database error: ${error.message}`;
  }
}

/**
 * Get HTTP status code from Postgrest error
 */
export function getStatusCodeFromPostgrestError(error: PostgrestError): number {
  // Map Postgres error codes to HTTP status codes
  switch (error.code) {
    case '23505': return 409; // Conflict
    case '23503': return 400; // Bad Request
    case '42P01':
    case '42703': return 500; // Server Error
    case '28000': return 401; // Unauthorized
    case '40001': return 503; // Service Unavailable
    case '57014': return 504; // Gateway Timeout
    default: return 500;
  }
}

/**
 * Handle successful API operations with appropriate UI feedback
 * This is the standardized success handling function that should be used across the application
 *
 * @param message - The success message to display
 * @param options - Optional configuration for the toast notification
 */
export function handleApiSuccess(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  const { title = 'Success', duration = 3000 } = options || {};

  // Use the toast notification system to show success messages
  toast({
    title,
    description: message,
    duration,
  });
}

// Format validation errors into a readable string
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

// Handle validation errors
export function handleValidationError(errors: Record<string, string[]>, context?: string): void {
  errorService.handleValidationError(errors, context);
}

// Handle network errors
export function handleNetworkError(error: Error, context?: string): void {
  errorService.handleNetworkError(error, context);
}

// Generic error handler
export function handleError(
  error: any,
  options: {
    context?: string;
    severity?: 'error' | 'warning' | 'info';
    category?: string;
    code?: string;
  } = {}
): void {
  errorService.handleError(error, options);
}

// Legacy wrapper for backward compatibility
export * from '@/lib/api/error-handlers';
