
import { UUID, ensureUUID } from '@/utils/database-type-helpers';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Helper function for safely casting IDs in Supabase queries
 * This ensures we're passing the correct UUID type to the database
 */
export function safeQuery<T extends Record<string, any>>(
  query: PostgrestFilterBuilder<any, any, T>,
  column: keyof T | string,
  value: string | UUID | null | undefined
): PostgrestFilterBuilder<any, any, T> {
  if (!value) throw new Error(`Invalid value for column: ${String(column)}`);
  return query.eq(column as string, value);
}

/**
 * Helper function for safely handling database response data
 * This ensures we're properly handling the types in the response
 */
export function safelyGetData<T>(response: { data: T | null; error: any }): T | null {
  if (response.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return response.data;
}

/**
 * Type-safe cast for Supabase response data
 * This avoids type errors when working with the response data
 */
export function castResponseData<T, R>(data: T | null): R | null {
  if (!data) return null;
  return data as unknown as R;
}
