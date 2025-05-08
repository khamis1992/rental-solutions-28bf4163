
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Type guard for successful database responses
 */
export function isSuccessResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Helper function to verify that status value is within allowed values
 */
export function isValidStatus<T extends { status: string }>(
  record: T,
  allowedStatuses: string[]
): boolean {
  return allowedStatuses.includes(record.status);
}

/**
 * Helper function to ensure a value is always an array
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Helper function to format validation errors
 */
export function formatErrors(
  errors: Record<string, string[]>
): Record<string, string> {
  return Object.entries(errors).reduce(
    (result, [field, messages]) => {
      result[field] = messages.join(', ');
      return result;
    },
    {} as Record<string, string>
  );
}
