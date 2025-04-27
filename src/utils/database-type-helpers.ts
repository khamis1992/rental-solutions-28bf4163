
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];

/**
 * Cast a string to a specific table's ID type
 * @param table Table name from the database schema
 * @param id String ID to cast to the table's ID type
 * @returns The ID with the correct type for the table
 */
export function asTableId<T extends TableNames>(table: T, id: string): RowType<T>['id'] {
  return id as RowType<T>['id'];
}

/**
 * Cast a string to a specific table's status type
 * @param table Table name from the database schema
 * @param status String status to cast to the table's status type
 * @returns The status with the correct type for the table
 */
export function asTableStatus<T extends TableNames>(table: T, status: string): RowType<T>['status'] {
  return status as RowType<T>['status'];
}

// Specialized helpers for commonly used IDs
export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

export function asAgreementId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asImportId(id: string): Tables['agreement_imports']['Row']['id'] {
  return id as Tables['agreement_imports']['Row']['id'];
}

export function asTrafficFineId(id: string): Tables['traffic_fines']['Row']['id'] {
  return id as Tables['traffic_fines']['Row']['id'];
}

export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

export function asMaintenanceId(id: string): Tables['maintenance']['Row']['id'] {
  return id as Tables['maintenance']['Row']['id'];
}

// Column-specific type casting functions
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asPaymentStatus(status: string): Tables['unified_payments']['Row']['status'] {
  return status as Tables['unified_payments']['Row']['status'];
}

export function asMaintenanceStatus(status: string): Tables['maintenance']['Row']['status'] {
  return status as Tables['maintenance']['Row']['status'];
}

// Additional table-specific field helpers
export function asLeaseIdField(id: string) {
  return id as Tables['leases']['Row']['id'];
}

export function asLeaseStatusUpdate(status: string) {
  return { status: status as Tables['leases']['Row']['status'] };
}

export function asTrafficFineAgreementId(id: string) {
  return id as Tables['traffic_fines']['Row']['agreement_id'];
}

export function asOverduePaymentAgreementId(id: string) {
  return id as Tables['overdue_payments']['Row']['agreement_id'];
}

export function asUnifiedPaymentLeaseId(id: string) {
  return id as Tables['unified_payments']['Row']['lease_id'];
}

// Column alias for backward compatibility
export function asLeaseIdColumn(id: string) {
  return asLeaseId(id);
}

export function asStatusColumn(status: string) {
  return status as string;
}

export function asPaymentStatusColumn(status: string) {
  return asPaymentStatus(status);
}

/**
 * Cast a database ID for type safety with Supabase
 * @param id The ID to cast to a database ID type
 * @returns The same ID with proper typing for database operations
 */
export function castDbId(id: string): string {
  return id;
}

// Additional helper to ensure type compatibility
export function ensureDbId<T extends string>(id: string): T {
  return id as T;
}

/**
 * Type guard to check if a value exists (is not null or undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if object has expected properties
 */
export function hasProperties<T extends object, K extends keyof T>(
  obj: T | null | undefined, 
  ...keys: K[]
): obj is T {
  if (!obj) return false;
  return keys.every(key => key in obj);
}
