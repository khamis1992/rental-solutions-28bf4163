
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { exists } from '@/utils/response-mapper';
import { logOperation } from '@/utils/monitoring-utils';

/**
 * Type for database ID that ensures consistent typing across the application
 */
export type DatabaseId = string;

/**
 * Type guard to check if a value is a valid DatabaseId
 */
export function isValidDatabaseId(id: unknown): id is DatabaseId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Safely cast any string ID to the proper database ID type
 * This is a type assertion function that helps TypeScript understand 
 * the ID is correctly formatted, but doesn't perform runtime validation
 */
export function castToDatabaseId(id: string): DatabaseId {
  return id as DatabaseId;
}

/**
 * Type guard to check if a Supabase response has data and is not an error
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T }) {
  if (!response) return false;
  if (response.error) return false;
  return response.data !== null && response.data !== undefined;
}

/**
 * Safely extract data from a Supabase response
 * Returns null if response is invalid or has an error
 */
export function extractResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): T | null {
  if (!hasResponseData(response)) {
    if (response?.error) {
      logOperation(
        'typeHelpers.extractResponseData', 
        'error', 
        { error: response.error }, 
        'Database error'
      );
    }
    return null;
  }
  return response.data;
}

/**
 * Type guard to ensure array type
 * Useful when dealing with potentially unknown response structures
 */
export function ensureArray<T>(data: T | T[] | null | undefined): T[] {
  if (data === null || data === undefined) {
    return [];
  }
  return Array.isArray(data) ? data : [data];
}

/**
 * Database table types for easier referencing
 */
export type Tables = Database['public']['Tables'];

/**
 * Type for payment status from database schema
 */
export type PaymentStatusType = Tables['unified_payments']['Row']['status'];

/**
 * Convert string to strongly typed payment status
 */
export function toPaymentStatus(status: string): PaymentStatusType {
  return status as PaymentStatusType;
}

/**
 * Handle Supabase response with proper error logging and type safety
 */
export function handleDatabaseResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response?.error) {
    logOperation(
      'typeHelpers.handleDatabaseResponse', 
      'error', 
      { error: response.error }, 
      'Database error'
    );
    return null;
  }
  
  return response?.data || null;
}

/**
 * Type assertion function to cast string ID to the database table's ID type
 */
export function castToTableId<T extends keyof Tables>(id: string, _table: T): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

/**
 * Safe way to access properties from a Supabase response that might be an error
 */
export function safelyAccessProperty<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue;
  return (obj as any)[key] ?? defaultValue;
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Creates a strongly typed filter for a specific table column
 */
export function createTableColumnFilter<
  T extends keyof Database['public']['Tables'],
  C extends keyof Database['public']['Tables'][T]['Row']
>(table: T, column: C) {
  return function(value: Database['public']['Tables'][T]['Row'][C]) {
    return { column: column as string, value };
  };
}
