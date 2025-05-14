
/**
 * API Hooks Module
 * This module exports utility functions for API error handling.
 * It serves as a compatibility layer for other modules that expect these functions.
 */

import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';
import { handleError } from '@/utils/error-handler';
export * from './api/index';

/**
 * Handles API errors with appropriate UI feedback
 * @param error Error from API request
 * @param context Optional context for the error message
 */
export function handleApiError(error: unknown, context?: string): void {
  // Use the standardized error handler with backward compatibility
  handleError(error, { context: context || 'API Request' });
}

/**
 * Legacy type guard for PostgrestError
 * @deprecated Use the standardized error handler instead
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
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
  toast.success('Success', {
    description: message,
  });
}

/**
 * Format validation errors into a readable string
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
