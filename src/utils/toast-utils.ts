
import { toast } from 'sonner';

/**
 * Unified toast notification utilities to ensure consistent messaging throughout the application
 */

/**
 * Display a success toast notification
 * @param message The success message to display
 * @param details Optional additional details
 */
export function showSuccessToast(message: string, details?: string): void {
  toast.success(message, {
    description: details,
    duration: 4000,
  });
}

/**
 * Display an error toast notification with intelligent error extraction
 * @param error The error object or message
 * @param context Optional context for where the error occurred
 */
export function showErrorToast(error: unknown, context?: string): void {
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (isObjectWithMessage(error)) {
    errorMessage = error.message;
  }
  
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  toast.error('Error', {
    description: errorMessage,
    duration: 5000,
  });
}

/**
 * Display a warning toast notification
 * @param message The warning message to display
 * @param details Optional additional details
 */
export function showWarningToast(message: string, details?: string): void {
  toast.warning(message, {
    description: details,
    duration: 4000,
  });
}

/**
 * Display an info toast notification
 * @param message The info message to display
 * @param details Optional additional details
 */
export function showInfoToast(message: string, details?: string): void {
  toast.info(message, {
    description: details,
    duration: 3000,
  });
}

/**
 * Type guard for objects with a message property
 */
function isObjectWithMessage(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'message' in obj && 
    typeof (obj as any).message === 'string'
  );
}

/**
 * Format validation errors into a readable string
 * @param errors Record of validation errors
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
