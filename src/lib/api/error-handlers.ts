
import { toast } from 'sonner';

/**
 * Handle API success with toast notification
 */
export function handleApiSuccess(message: string): void {
  toast.success(message);
}

/**
 * Handle API errors with toast notification
 */
export function handleApiError(error: unknown): void {
  const errorMessage = getErrorMessage(error);
  toast.error(`Error: ${errorMessage}`);
  console.error('API Error:', error);
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return 'Unknown error occurred';
}
