
/**
 * Helper functions to safely cast database IDs and column values
 * for type safety with the Supabase client
 */

import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Cast a string to a valid UUID for database operations
export function castToUUID<T extends string>(id: T): string {
  return id;
}

// Type helpers for database column names
export function asStatusColumn(status: string): string {
  return status;
}

export function asVehicleId(id: string): string {
  return id;
}

export function asCustomerId(id: string): string {
  return id;
}

export function asProfileId(id: string): string {
  return id;
}

export function asPaymentId(id: string): string {
  return id;
}

// Additional column helpers for compatibility with existing code
export function asTableId(id: string): string {
  return id;
}

export function asLeaseIdColumn(id: string): string {
  return id;
}

export function asAgreementIdColumn(id: string): string {
  return id;
}

export function asImportIdColumn(id: string): string {
  return id;
}

export function asTrafficFineIdColumn(id: string): string {
  return id;
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
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null;
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
