/**
 * Helper functions to safely cast database IDs and column values
 * for type safety with the Supabase client
 */

import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

type SchemaName = keyof Database;
type Tables = Database['public']['Tables'];

// Generic database ID type
export type DatabaseId = string;

// Cast a string to a valid UUID for database operations
export function castToUUID<T extends string>(id: T): string {
  return id;
}

// Helper function to correctly cast IDs for specific tables
export function asColumnValue<T extends keyof Tables, C extends keyof Tables[T]['Row']>(
  table: T, column: C, value: any
): Tables[T]['Row'][C] {
  return value as Tables[T]['Row'][C];
}

// Type helpers for database column names with proper typing
export function asStatusColumn(status: string): string {
  return status;
}

// Cast an ID for vehicle tables
export function asVehicleId(id: string): string {
  return id;
}

// Cast an ID for customer tables
export function asCustomerId(id: string): string {
  return id;
}

// Cast an ID for profile tables
export function asProfileId(id: string): string {
  return id;
}

// Cast an ID for payment tables
export function asPaymentId(id: string): string {
  return id;
}

// Cast an ID for lease tables
export function asLeaseId(id: string): string {
  return id;
}

// Cast a specific lease id column
export function asLeaseIdColumn(id: string): string {
  return id;
}

// Additional column helpers for compatibility with existing code
export function asTableId(id: string): string {
  return id;
}

// General purpose DB ID casting - use this when table type is unknown or generic
export function castDbId<T = string>(id: string): T {
  return id as unknown as T;
}

// Function to check if a value exists (not null or undefined)
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Safe property accessor
export const getPropertySafely = <T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return !!response && !response.error && response.data !== null && response.data !== undefined;
}

/**
 * Safely extract data from a Supabase response
 */
export function safelyExtractData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): T | null {
  if (!response || response.error || !response.data) {
    console.error('Error in response:', response?.error);
    return null;
  }
  return response.data;
}

/**
 * Handle Supabase response with proper error logging
 */
export function handleDatabaseResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): T | null {
  if (response.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return response.data || null;
}
