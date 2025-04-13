
import { Database } from '@/types/database.types';
import { DbTables, SchemaName } from '@/types/database-types';

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
 * Cast a string to a proper lease ID type
 */
export function asLeaseId(id: string): DbTables['leases']['Row']['id'] {
  return id as DbTables['leases']['Row']['id'];
}

/**
 * Cast a string to a proper payment ID type
 */
export function asPaymentId(id: string): DbTables['unified_payments']['Row']['id'] {
  return id as DbTables['unified_payments']['Row']['id'];
}

/**
 * Cast a string to a proper vehicle ID type
 */
export function asVehicleId(id: string): DbTables['vehicles']['Row']['id'] {
  return id as DbTables['vehicles']['Row']['id'];
}

/**
 * Cast a string to a proper customer ID type
 */
export function asCustomerId(id: string): DbTables['profiles']['Row']['id'] {
  return id as DbTables['profiles']['Row']['id'];
}

/**
 * Cast a string to a proper agreement ID type
 */
export function asAgreementId(id: string): DbTables['leases']['Row']['id'] {
  return id as DbTables['leases']['Row']['id'];
}

/**
 * Cast a string to a proper lease_id column type
 */
export function asLeaseIdColumn(id: string): DbTables['unified_payments']['Row']['lease_id'] {
  return id as DbTables['unified_payments']['Row']['lease_id'];
}

/**
 * Cast a string to a proper agreement_id column type
 */
export function asAgreementIdColumn(id: string): DbTables['traffic_fines']['Row']['agreement_id'] {
  return id as DbTables['traffic_fines']['Row']['agreement_id'];
}

/**
 * Cast a string to a proper import_id column type
 */
export function asImportIdColumn(id: string): DbTables['agreement_import_reverts']['Row']['import_id'] {
  return id as DbTables['agreement_import_reverts']['Row']['import_id'];
}

/**
 * Cast a string to a proper status column type
 */
export function asStatusColumn<T extends keyof DbTables, K extends keyof DbTables[T]['Row']>(
  status: string,
  table: T,
  column: K
): DbTables[T]['Row'][K] {
  return status as DbTables[T]['Row'][K];
}

/**
 * Type guard function to check if response data is valid
 */
export function isValidData<T>(data: any): data is T {
  return data !== null && typeof data === 'object' && !('error' in data);
}
