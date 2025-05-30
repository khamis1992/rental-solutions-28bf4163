
import type { Database } from '@/types/database.types';

/**
 * Safe UUID type casting for database operations
 * @param id Any string ID to cast to UUID
 * @returns UUID string for Supabase operations
 */
export function castDbId(id: string): string {
  return id;
}

/**
 * Type-safe transformation of potentially nested response data
 * @param data Response data that might be single object or array
 * @param transformer Function to transform each item
 * @returns Transformed data maintaining the same structure
 */
export function transformResponseData<T, R>(
  data: T | T[] | null | undefined,
  transformer: (item: T) => R
): R | R[] | null {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(transformer);
  }
  
  return transformer(data);
}

/**
 * Safely convert any value to array format
 * @param value Single item or array of items
 * @returns Array of items
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  
  if (Array.isArray(value)) {
    return value;
  }
  
  return [value];
}

/**
 * Type guard to check if an object has a specific property
 * @param obj Object to check
 * @param key Property key to check for
 * @returns Type predicate indicating if property exists
 */
export function hasProperty<T extends Record<string, any>, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Safe property access with fallback
 * @param obj Object to access property from
 * @param key Property key
 * @param fallback Default value if property doesn't exist
 * @returns Property value or fallback
 */
export function getProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K]
): T[K] | undefined {
  if (!obj || !(key in obj)) {
    return fallback;
  }
  return obj[key];
}

/**
 * Database table type definitions
 */
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

/**
 * Get row type for a specific table
 */
export type TableRow<T extends TableName> = Tables[T]['Row'];

/**
 * Get insert type for a specific table
 */
export type TableInsert<T extends TableName> = Tables[T]['Insert'];

/**
 * Get update type for a specific table
 */
export type TableUpdate<T extends TableName> = Tables[T]['Update'];

/**
 * Extract ID type from a table row
 */
export type TableId<T extends TableName> = TableRow<T>['id'];

/**
 * Type-safe ID casting for specific tables
 */
export function castTableId<T extends TableName>(id: string, _table: T): TableId<T> {
  return id as TableId<T>;
}
