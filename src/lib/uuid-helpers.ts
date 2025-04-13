
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { Database } from '@/types/database.types';

/**
 * Type-safe UUID type for the database
 */
export type UUID = string;

/**
 * Type validator for UUIDs
 */
export function isUUID(value: unknown): value is UUID {
  if (typeof value !== 'string') return false;
  
  // Simple UUID validation - checks for the basic format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Safely casts a string to a UUID for database operations
 * Does not perform runtime validation - use isUUID for that
 */
export function asUUID(id: string): UUID {
  return id as UUID;
}

/**
 * List of all supported tables for typed operations
 */
export type SupportedTable = keyof Database['public']['Tables'];

/**
 * Safely cast string to a table-specific ID type
 * This helps TypeScript understand we're using the right ID type for a specific table
 */
export function asTableId<T extends SupportedTable>(
  table: T, 
  id: string
): string {
  return id;
}

/**
 * Creates a type-safe filter for a Supabase query
 * This ensures type compatibility when filtering by ID fields
 */
export function filterById<T>(
  query: PostgrestFilterBuilder<any, any, any>, 
  columnName: string, 
  id: string
): PostgrestFilterBuilder<any, any, any> {
  // Convert string ID to the expected format for the database
  return query.eq(columnName, asUUID(id));
}

/**
 * Cast any string to a UUID type for database operations
 * This is useful when you need to pass a string ID to a database operation
 */
export function castToUUID(id: string): UUID {
  // In a real application, you might want to add validation here
  return id as UUID;
}

/**
 * Helper function to safely cast a string ID to a specific table's ID type
 * for use in database operations like eq(), in(), etc.
 */
export function tableId<T extends SupportedTable>(
  tableName: T,
  columnName: keyof Database['public']['Tables'][T]['Row'],
  id: string
): string {
  return id;
}
