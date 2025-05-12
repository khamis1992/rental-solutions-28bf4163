
import { PostgrestError } from '@supabase/supabase-js';
import { showErrorToast, showSuccessToast } from '@/utils/toast-utils';
import { ServiceResult } from '@/services/base/BaseService';

/**
 * Enhanced API error handler with detailed logging and typed error recognition
 * @param error Error from API request
 * @param context Optional context for the error message
 * @param operation Optional operation name for more specific error context
 */
export function handleApiError(
  error: unknown, 
  context?: string,
  operation?: string
): void {
  console.error(`API Error${context ? ` in ${context}` : ''}${operation ? ` during ${operation}` : ''}:`, error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = '';
  let errorCode = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (isPostgrestError(error)) {
    errorMessage = `Database error: ${error.message}`;
    errorDetails = `Code: ${error.code}, Details: ${error.details || 'None'}`;
    errorCode = error.code;
    
    // Handle specific database errors with more user-friendly messages
    errorMessage = getPostgrestErrorMessage(error, context);
  } else if (isServiceError(error)) {
    errorMessage = error.error?.toString() || 'Service operation failed';
    errorDetails = JSON.stringify(error.meta || {});
  }
  
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  // Log detailed error information for debugging
  console.error(`Error Details - Message: ${errorMessage}, Code: ${errorCode}, Details: ${errorDetails}`);
  
  showErrorToast(errorMessage);
}

/**
 * Get a user-friendly error message for PostgreSQL errors
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
 * Type guard for Postgrest errors
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Type guard for Service errors
 */
function isServiceError<T>(error: unknown): error is ServiceResult<T> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    !(error as any).success
  );
}

/**
 * Handles successful API operations with appropriate UI feedback
 * @param message Success message to display
 * @param details Optional additional details
 */
export function handleApiSuccess(message: string, details?: string): void {
  console.log(`API Success: ${message}${details ? ` - ${details}` : ''}`);
  showSuccessToast(message, details);
}

/**
 * Creates a detailed error with context
 * @param message The error message
 * @param context The context in which the error occurred
 * @param details Additional error details
 */
export function createDetailedError(
  message: string,
  context: string,
  details?: Record<string, any>
): Error {
  const error = new Error(`${context}: ${message}`);
  if (details) {
    (error as any).details = details;
  }
  return error;
}
