/**
 * Standardized error handling utilities for the application
 */
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface ErrorOptions {
  showToast?: boolean;
  customMessage?: string;
  context?: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Handles API errors consistently throughout the application
 * @param error The error object caught
 * @param options Configuration options for error handling
 * @returns A standardized error object
 */
export function handleError(
  error: unknown, 
  options: ErrorOptions = { showToast: true, severity: 'error' }
) {
  const { showToast = true, customMessage, context = 'Operation', severity = 'error' } = options;
  
  // Format error based on type
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = '';
  let errorCode = 'UNKNOWN_ERROR';
  
  // Handle different error types
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (isPostgrestError(error)) {
    errorMessage = error.message;
    errorDetails = `Code: ${error.code}, Details: ${error.details || 'No details provided'}`;
    errorCode = error.code;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error);
  }
  
  // Log with context for debugging
  console.error(`${context} error:`, {
    message: errorMessage,
    details: errorDetails,
    code: errorCode,
    originalError: error,
  });
  
  // Show user-friendly notification if required
  if (showToast) {
    toast[severity](customMessage || `${context} failed`, {
      description: customMessage ? errorMessage : 'Please try again or contact support',
      duration: 5000,
    });
  }
  
  // Return standardized error object
  return {
    message: errorMessage,
    details: errorDetails,
    code: errorCode,
    originalError: error,
  };
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return Boolean(
    error && 
    typeof error === 'object' && 
    'code' in error && 
    'message' in error &&
    typeof (error as PostgrestError).code === 'string'
  );
}

/**
 * Handle database connection errors specifically
 */
export function handleConnectionError(error: unknown, retryAction?: () => void) {
  const standardError = handleError(error, {
    context: 'Database connection', 
    customMessage: 'Connection issues detected',
    showToast: true
  });
  
  if (retryAction) {
    toast.error('Connection failed', {
      description: 'Tap to retry connection',
      duration: 10000,
      action: {
        label: 'Retry',
        onClick: retryAction,
      },
    });
  }
  
  return standardError;
}

/**
 * Create a wrapped fetch function that handles errors consistently
 * @param fetchFn The original fetch function to wrap
 * @param errorContext Context description for error messages
 */
export function withErrorHandling<T, P extends any[]>(
  fetchFn: (...args: P) => Promise<T>,
  errorContext: string
) {
  return async (...args: P): Promise<T | null> => {
    try {
      return await fetchFn(...args);
    } catch (error) {
      handleError(error, { context: errorContext });
      return null;
    }
  };
}
