
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

/**
 * Handles API errors with appropriate UI feedback and detailed logging
 * @param error Error from API request
 * @param context Optional context for the error message
 */
export function handleApiError(error: unknown, context?: string): void {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (isPostgrestError(error)) {
    errorMessage = `Database error: ${error.message}`;
    errorDetails = `Code: ${error.code}, Details: ${error.details || 'None'}`;
    
    // Handle specific database errors with more user-friendly messages
    switch (error.code) {
      case '23505':
        errorMessage = 'A record with this information already exists.';
        break;
      case '23503':
        errorMessage = 'This record cannot be modified because it is referenced by other data.';
        break;
      case '42P01':
        errorMessage = 'Database table not found. Please contact support.';
        break;
      case '42703':
        errorMessage = 'Database column not found. Please contact support.';
        break;
      case '28000':
        errorMessage = 'Authentication failed. Please try signing in again.';
        break;
      case '40001':
        errorMessage = 'Database is temporarily unavailable. Please try again.';
        break;
      case '57014':
        errorMessage = 'Query timed out. Please try again with a simpler request.';
        break;
    }
  }
  
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  // Log detailed error information for debugging
  console.error(`Error Details - Message: ${errorMessage}, Details: ${errorDetails}`);
  
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
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
 * Handles successful API operations with appropriate UI feedback
 * @param message Success message to display
 */
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
  });
}

/**
 * Format validation errors into a readable string with detailed context
 * @param errors Validation error object
 * @param formContext Optional context about which form had errors
 */
export function formatValidationErrors(
  errors: Record<string, string[]>, 
  formContext?: string
): string {
  const formattedErrors = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
  
  if (formContext) {
    return `${formContext} validation errors:\n${formattedErrors}`;
  }
  
  return formattedErrors;
}
