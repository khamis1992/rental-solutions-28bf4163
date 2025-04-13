
import { Database } from '@/types/database.types';

/**
 * Helper function to cast string IDs to the correct database type
 * 
 * This helps with TypeScript type errors when passing string IDs to Supabase queries
 * that expect specific database column types.
 * 
 * @param id - The string ID to cast
 * @returns The ID with the correct TypeScript type
 */
export function asDbId<T>(id: string): T {
  return id as T;
}

/**
 * Cast a string to a proper agreement/lease ID type
 */
export function asAgreementId(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper lease ID type
 */
export function asLeaseId(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper payment ID type
 */
export function asPaymentId(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper vehicle ID type
 */
export function asVehicleId(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper customer ID type
 */
export function asCustomerId(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper lease_id column type
 */
export function asLeaseIdColumn(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper agreement_id column type
 */
export function asAgreementIdColumn(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper import_id column type
 */
export function asImportIdColumn(id: string): string {
  return id as any;
}

/**
 * Cast a string to a proper status column type
 */
export function asStatusColumn(status: string, table: string, column: string): string {
  return status as any;
}

/**
 * Type guard function to check if response data is valid
 */
export function isValidData<T>(data: any): data is T {
  return data !== null && typeof data === 'object' && !('error' in data);
}

/**
 * Type guard for checking response data
 */
export function hasResponseData<T>(response: any): response is { data: T; error: null } {
  return response && !response.error && response.data;
}
