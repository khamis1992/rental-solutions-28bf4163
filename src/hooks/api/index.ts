
/**
 * API Hooks Module
 *
 * This module exports all API-related hooks and utilities for consistent usage across the application.
 * Always import from this module rather than individual files to ensure consistent behavior.
 *
 * Example usage:
 * ```
 * import { useApiQuery, useApiMutation, useCrudApi } from '@/hooks/api';
 * ```
 */

// Export the standardized API hooks
export * from './use-api-query';
export * from './use-api-mutation';
export * from './use-crud-api';

// Re-export error handling functions for convenience
export {
  handleApiError,
  handleApiSuccess,
  handleValidationError,
  handleNetworkError
} from '@/lib/api/error-api';
