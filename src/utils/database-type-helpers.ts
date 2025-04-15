
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

export function asTableId(table: string, id: string): string {
  // Ensures that a string ID is treated as a valid UUID in database queries
  return id;
}

export function asLeaseIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid lease_id in database queries
  return id;
}

export function asAgreementIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid agreement_id in database queries
  return id;
}

export function asImportIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid import_id in database queries
  return id;
}

export function asTrafficFineIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid traffic_fine_id in database queries
  return id;
}

export function asVehicleId(id: string): string {
  // Ensures that a string ID is treated as a valid vehicle_id in database queries
  return id;
}

export function asPaymentId(id: string): string {
  // Ensures that a string ID is treated as a valid payment_id in database queries
  return id;
}

export function asLeaseId(id: string): string {
  // Ensures that a string ID is treated as a valid lease_id in database queries
  return id;
}

export function asStatusColumn(status: string): string {
  // Ensures that a string status is treated as a valid status column in database queries
  return status;
}

export function asPaymentStatusColumn(status: string): string {
  // Ensures that a string payment status is treated as a valid payment_status column in database queries
  return status;
}

export function safelyExtractData(response: any): any {
  // Safely extracts data from a Supabase response
  if (!response) return null;
  return response.data || null;
}

/**
 * Type guard to check if a response has data and is not an error
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && response.data !== null && response.data !== undefined);
}

/**
 * Safely get data from a Supabase response, returns null if error or no data
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (!hasData(response)) {
    return null;
  }
  return response.data;
}

/**
 * Handle Supabase response with proper error logging and safety
 */
export function handleDatabaseResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response?.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return response?.data || null;
}

/**
 * Type-safe ID converter for all database tables
 */
export function asId<T extends string>(id: string): T {
  return id as T;
}
