
import { toast } from '@/hooks/use-toast';

/**
 * Handles API errors and displays appropriate toast messages
 * @param error - The error object
 * @param defaultMessage - Optional default message to display
 */
export function handleApiError(error: unknown, defaultMessage?: string): void {
  console.error('API Error:', error);
  
  const errorMessage = getErrorMessage(error);
  
  toast({
    variant: 'destructive',
    title: 'Error',
    description: errorMessage || defaultMessage || 'An unexpected error occurred'
  });
}

/**
 * Displays a success message for API operations
 * @param message - Success message to display
 */
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message
  });
}

/**
 * Extracts a readable error message from different error types
 * @param error - The error object
 * @returns Formatted error message string
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}
