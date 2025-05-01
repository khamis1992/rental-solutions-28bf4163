
import { toast } from '@/hooks/use-toast';
import { errorService } from '@/services/error/ErrorService';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Unified error handling API that centralizes all error handling functionality
 */

// Handle API errors with appropriate UI feedback
export function handleApiError(error: unknown, context?: string): void {
  errorService.handleApiError(error, context);
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

// Handle successful API operations with appropriate UI feedback
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
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
