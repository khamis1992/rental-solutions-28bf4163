
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Check if the response has data and no error
 */
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Get error message from a PostgrestError or create a default one
 */
export function getErrorMessage(
  response: { error: PostgrestError | null } | null | undefined,
  defaultMessage = 'Unknown database error'
): string {
  if (!response) return defaultMessage;
  if (!response.error) return '';
  
  return response.error.message || response.error.details || defaultMessage;
}

/**
 * Safely get data from response, handling null cases
 */
export function getResponseData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): T | null {
  if (hasData(response)) {
    return response.data;
  }
  return null;
}

/**
 * Type guard to check if response has a specific error code
 */
export function hasErrorCode(
  response: { error: PostgrestError | null },
  code: string
): boolean {
  return !!response.error && response.error.code === code;
}
