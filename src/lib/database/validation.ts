
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];

/**
 * Type guard to check if a response has data and no error
 */
export function isSuccessResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is PostgrestResponse<T> & { data: T; error: null; status: number; statusText: string; count?: number | null } {
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

/**
 * Validates if a string is a valid database ID
 * Checks if the string is a valid UUID format
 */
export function isValidDatabaseId(id: string | null | undefined): boolean {
  if (!id) return false;
  
  // Regular expression for UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
