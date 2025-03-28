
import { toast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Standard error handler for API calls.
 * Use this to handle errors from Supabase and other API calls consistently.
 */
export function handleApiError(error: unknown, context?: string): void {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  
  // Handle specific error types
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (isPostgrestError(error)) {
    errorMessage = `Database error: ${error.message}`;
    
    // Handle specific database errors
    if (error.code === '23505') {
      errorMessage = 'A record with this information already exists.';
    } else if (error.code === '23503') {
      errorMessage = 'This record cannot be modified because it is referenced by other data.';
    } else if (error.code === '42P01') {
      errorMessage = 'Database table not found. Please contact support.';
    }
  }
  
  // Add context to the error message if provided
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  // Show toast notification for the error
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
}

/**
 * Type guard to check if an error is a PostgrestError from Supabase
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
 * Format validation errors from form submissions
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

/**
 * Standardized success handler
 */
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
  });
}
