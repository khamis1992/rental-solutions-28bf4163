
import { Database } from "@/types/database.types";
import { PostgrestSingleResponse, PostgrestResponse } from "@supabase/supabase-js";

type Tables = Database['public']['Tables'];
type SchemaName = keyof Database;

/**
 * Helper function to cast string IDs to the correct database type
 */
export function asTableId<T extends keyof Tables>(
  table: T,
  id: string
): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

/**
 * Cast string values to database column types
 */
export function asColumnValue<
  T extends keyof Tables,
  K extends keyof Tables[T]['Row']
>(
  table: T,
  column: K,
  value: string | number | boolean
): Tables[T]['Row'][K] {
  return value as Tables[T]['Row'][K];
}

/**
 * Common table ID casting functions
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

export function asLeaseIdColumn(id: string): string {
  return id;
}

export function asImportIdColumn(id: string): string {
  return id;
}

export function asAgreementIdColumn(id: string): string {
  return id;
}

/**
 * Cast enums and statuses 
 */
export function asStatusColumn<T extends keyof Tables>(
  status: string,
  table: T,
  column: keyof Tables[T]['Row'] & string
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
  return hasResponseData(response) ? response.data : null;
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
