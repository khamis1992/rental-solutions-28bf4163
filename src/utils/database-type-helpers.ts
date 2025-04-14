
import { Database } from "@/types/database.types";
import { PostgrestSingleResponse, PostgrestResponse } from "@supabase/supabase-js";

// Define a more flexible type system for database operations
export type DbTables = Database['public']['Tables'];
export type SchemaName = keyof Database;

/**
 * Universal ID casting function for all table types
 * This safely converts string IDs to the correct database types
 */
export function asTableId<T extends keyof DbTables>(
  _table: T,
  id: string
): DbTables[T]['Row']['id'] {
  return id as DbTables[T]['Row']['id'];
}

/**
 * Cast string values to database column types
 * Handles type safety for Supabase queries
 */
export function asColumnValue<
  T extends keyof DbTables,
  K extends keyof DbTables[T]['Row']
>(
  _table: T,
  _column: K,
  value: string | number | boolean
): DbTables[T]['Row'][K] {
  return value as DbTables[T]['Row'][K];
}

/**
 * Common table ID casting functions with simplified implementation
 */
export function asAgreementId(id: string): string {
  return id;
}

export function asLeaseId(id: string): string {
  return id;
}

export function asVehicleId(id: string): string {
  return id;
}

export function asPaymentId(id: string): string {
  return id;
}

export function asProfileId(id: string): string {
  return id;
}

/**
 * Common column ID casting functions for foreign keys and other fields
 */
export function asLeaseIdColumn(id: string): string {
  return id;
}

export function asImportIdColumn(id: string): string {
  return id;
}

export function asAgreementIdColumn(id: string): string {
  return id;
}

export function asTrafficFineIdColumn(id: string): string {
  return id;
}

export function asVehicleIdColumn(id: string): string {
  return id;
}

export function asAgreementStatusColumn(status: string): string {
  return status;
}

export function asPaymentStatusColumn(status: string): string {
  return status;
}

/**
 * Cast enums and statuses 
 */
export function asStatusColumn<T extends keyof DbTables>(
  status: string,
  _table: T,
  _column: keyof DbTables[T]['Row'] & string
): string {
  return status;
}

/**
 * Type guard to check if response has data
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}

/**
 * Extract error message from response
 */
export function getErrorMessage(error: any): string {
  return error?.message || 'An error occurred';
}

/**
 * Safe access to response data
 */
export function safeGetResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

/**
 * Helper to safely handle response objects that might be error objects
 */
export function safelyExtractData<T>(result: any): T | null {
  if (!result || result.error || !result.data) {
    return null;
  }
  return result.data as T;
}

/**
 * Type guard to check if a response is valid before accessing properties
 * Helps avoid "Property does not exist on type" errors
 */
export function safelyAccessResponseProperty<T, K extends keyof T>(
  response: { data: T | null; error: any } | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (response && !response.error && response.data && key in response.data) {
    return (response.data as T)[key];
  }
  return defaultValue;
}

/**
 * Type guard to safely handle Supabase response errors
 */
export function handleSupabaseResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): { data: T | null; error: Error | null } {
  if (response.error) {
    return { data: null, error: new Error(response.error.message) };
  }
  return { data: response.data, error: null };
}

/**
 * Safe null checking for database responses
 */
export function ensureDataExists<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): T | null {
  if (response.error || !response.data) {
    console.error("Database response error:", response.error);
    return null;
  }
  return response.data;
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}
