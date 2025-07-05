import type { Database } from '@/types/database.types';
import { Result, createSuccessResult, createErrorResult } from '@/lib/errors/types';
import { toAppError } from '@/lib/errors/error-handler';
import {
  type PostgrestSingleResponse,
  type PostgrestResponse,
} from '@supabase/supabase-js';

/**
 * Safe UUID type casting for database operations
 * @param id Any string ID to cast to UUID
 * @returns UUID string for Supabase operations
 */
export function castDbId(id: string): string {
  return id;
}

/**
 * Type guard to check if a value is a valid database ID
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid database ID
 */
export function isValidDbId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a valid database timestamp
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid database timestamp
 */
export function isValidDbTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

/**
 * Type guard to check if a value is a valid database JSON
 * @param value The value to check
 * @returns Boolean indicating if the value is a valid database JSON
 */
export function isValidDbJson(value: unknown): value is Database['public']['CompositeTypes']['Json'] {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isValidDbJson);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isValidDbJson);
  }
  return false;
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
 * Type guard to check if data exists and is not null/undefined
 * @param data Data to check
 * @returns Boolean indicating if data exists
 */
export function hasData<T>(data: T | null | undefined): data is T {
  return data !== null && data !== undefined;
}

/**
 * Get data from a Supabase response with proper error handling
 * @param response The Supabase response object
 * @returns The response data or null if there was an error
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): Result<T> {
  if (response.error) {
    const error = toAppError(response.error);
    console.error('Database response error:', error);
    return createErrorResult<T>(error);
  }

  if (!response.data) {
    const error = toAppError(new Error('No data returned from database query'));
    console.warn(error.message);
    return createErrorResult<T>(error);
  }

  return createSuccessResult(response.data as T);
}

/**
 * Cast string to UUID for database operations
 * @param id String ID to cast
 * @returns UUID string
 */
export function castToUUID(id: string): string {
  return id;
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

/**
 * Database view type definitions
 */
export type Views = Database['public']['Views'];

/**
 * Database function type definitions
 */
export type Functions = Database['public']['Functions'];

/**
 * Database enum type definitions
 */
export type Enums = Database['public']['Enums'];

/**
 * Database composite type definitions
 */
export type CompositeTypes = Database['public']['CompositeTypes'];
