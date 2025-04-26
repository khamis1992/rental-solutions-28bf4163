import { Database } from '@/types/database.types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Converts an ID to a proper table ID format
 * This function handles potential type conversions needed across the application
 * when interfacing with Supabase tables
 */
export function asTableId(tableName: string, id: string): string {
  // In this implementation, we simply return the ID as-is
  // But this function allows us to add any necessary transformations in the future
  return id;
}

/**
 * Helper for vehicle ID type conversion - specific wrapper around asTableId
 * Used for consistent typing across the application
 */
export function asVehicleId(id: string): string {
  return asTableId('vehicles', id);
}

/**
 * Helper for agreement/lease ID type conversion
 */
export function asLeaseId(id: string): string {
  return asTableId('leases', id);
}

/**
 * Helper for payment ID type conversion
 */
export function asPaymentId(id: string): string {
  return asTableId('unified_payments', id);
}

/**
 * Helper for agreement import ID type conversion
 */
export function asImportId(id: string): string {
  return asTableId('agreement_imports', id);
}

/**
 * Helper for traffic fine ID type conversion
 */
export function asTrafficFineId(id: string): string {
  return asTableId('traffic_fines', id);
}

/**
 * Helper for customer/profile ID type conversion
 */
export function asCustomerId(id: string): string {
  return asTableId('profiles', id);
}

/**
 * Helper for lease ID column conversion
 * Used to convert ID strings to a format accepted by Supabase for lease-related queries
 */
export function asLeaseIdColumn(id: string): string {
  return asTableId('leases', id);
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null;
}
