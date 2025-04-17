
import { Database } from '@/types/database.types';

/**
 * Helper to cast any string to a UUID format for database operations
 */
export function castToUUID(id: string): string {
  return id;
}

/**
 * Generic helper for working with standard database responses
 */
export function handleSupabaseResponse<T>(response: { data: T | null; error: any }): T | null {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return null;
  }
  return response.data;
}

/**
 * Check if a Supabase response contains valid data
 */
export function hasData<T>(response: { data: T | null; error: any }): boolean {
  return !response.error && response.data !== null;
}

/**
 * Cast a string ID to the appropriate database ID type
 */
export function castDbId<T>(id: string): T {
  return id as unknown as T;
}

/**
 * Safely get records from a database response
 * Returns an empty array if the response is invalid or has an error
 */
export function safelyGetRecordsFromResponse<T>(data: T[] | null | undefined): T[] {
  if (!data) {
    return [];
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Safely transform dates from the database
 * Handles both string and Date objects
 */
export function safeDateConversion(date: string | Date | null | undefined): Date | undefined {
  if (!date) return undefined;
  try {
    return typeof date === 'string' ? new Date(date) : date;
  } catch {
    return undefined;
  }
}

/**
 * Type-safe helper for database entity properties
 */
export function getEntityProperty<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row']
>(
  entity: Partial<Database['public']['Tables'][T]['Row']>,
  key: K
): Database['public']['Tables'][T]['Row'][K] | undefined {
  return entity[key];
}
