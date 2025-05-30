/**
 * API Hooks Module
 * This module exports utility functions for API error handling.
 * It serves as a compatibility layer for other modules that expect these functions.
 */

import { handleApiError, handleApiSuccess } from '@/lib/errors/error-handler';

// Re-export the centralized error handling functions
export { handleApiError, handleApiSuccess };

/**
 * Format validation errors into a readable string
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
