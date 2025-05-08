
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { LeaseStatus } from '@/types/lease-types';
import { Database } from '@/types/database.types';

/**
 * Type-safe cast for database IDs and enums
 */
export function asStatus<T extends string>(status: string): T {
  return status as T;
}

/**
 * Cast a string to a lease status
 */
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

/**
 * Cast a string to a database ID
 */
export function asDbId(id: string): string {
  return id;
}

/**
 * Cast a string to a lease ID
 */
export function asLeaseId(id: string): string {
  return id;
}

/**
 * Cast a string to an agreement ID
 */
export function asAgreementId(id: string): string {
  return id;
}

/**
 * Cast a string to a payment ID
 */
export function asPaymentId(id: string): string {
  return id;
}

/**
 * Cast a string to a maintenance ID
 */
export function asMaintenanceId(id: string): string {
  return id;
}

/**
 * Cast a string to a vehicle ID
 */
export function asVehicleId(id: string): string {
  return id;
}

/**
 * Cast a string to a column name for lease ID
 */
export function asLeaseIdColumn(columnName: string): string {
  return columnName;
}

/**
 * Type guard to check if Supabase response contains data
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: T; error: null } {
  if (!response) return false;
  if (response.error) return false;
  return response.data !== null && response.data !== undefined;
}

/**
 * Safely extract property from an object that might be null or have an error
 */
export function safeExtract<T, K extends keyof T>(
  obj: T | null | undefined | { error: any },
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue;
  if ('error' in obj && obj.error) return defaultValue;
  return (obj as T)[key] ?? defaultValue;
}

/**
 * Type guard to check if an object exists and is not an error
 */
export function isValidObject<T>(obj: T | null | undefined | { error: any }): obj is T {
  if (!obj) return false;
  if ('error' in obj && obj.error) return false;
  return true;
}
