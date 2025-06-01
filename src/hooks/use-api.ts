/**
 * API Hooks Module
 * This module exports utility functions for API error handling.
 * It serves as a compatibility layer for other modules that expect these functions.
 */

import { handleError } from '@/lib/errors/error-handler';

// Re-export the centralized error handling functions
export { handleError };

/**
 * Format validation errors into a readable string
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
