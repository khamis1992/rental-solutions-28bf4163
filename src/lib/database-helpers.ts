
import { Database } from '@/types/database.types';

/**
 * Type for database ID to ensure consistent typing across the application
 */
export type DatabaseId = string;

/**
 * Cast a string to a database ID for use in Supabase queries
 * This is a type assertion function to help TypeScript understand
 * the ID is correctly formatted, but doesn't perform validation
 */
export function asDatabaseId(id: string): DatabaseId {
  return id as DatabaseId;
}

/**
 * Type for database table
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Type-safe helper for casting a string ID to a table-specific ID
 */
export function asTableId<T extends TableName>(
  _tableName: T, 
  id: string
): Database['public']['Tables'][T]['Row']['id'] {
  return id as Database['public']['Tables'][T]['Row']['id'];
}

/**
 * Helper for status casting
 */
export function asTableStatus<T extends TableName>(
  _tableName: T,
  status: string
): string {
  return status as string;
}

/**
 * Cast a raw value to entity status
 */
export function asEntityStatus(status: string): string {
  return status;
}

/**
 * Helper function to safely handle optional parameters in database queries
 */
export function optionalParam<T>(value: T | null | undefined, defaultValue: T): T {
  return (value === null || value === undefined) ? defaultValue : value;
}

/**
 * Type guard to check if a response has error
 */
export function hasError(response: { error: any }): boolean {
  return response.error !== null && response.error !== undefined;
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(response: { data: T | null }): response is { data: T } {
  return response.data !== null && response.data !== undefined;
}
