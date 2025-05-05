
/**
 * Database utility functions
 */
import { Tables, TableRow } from './types';

/**
 * Converts a table ID to its proper type
 */
export function asTableId<T extends keyof Tables>(table: T, id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

/**
 * Selects a column from a table with proper typing
 */
export function asTableColumn<T extends keyof Tables, K extends keyof Tables[T]['Row']>(
  table: T,
  column: K,
  value: any
): Tables[T]['Row'][K] {
  return value as Tables[T]['Row'][K];
}

/**
 * Type-safe conversion for lease status values
 */
export function asLeaseStatus(status: string): TableRow<'leases'>['status'] {
  return status as TableRow<'leases'>['status'];
}

/**
 * Type-safe conversion for vehicle status values
 */
export function asVehicleStatus(status: string): TableRow<'vehicles'>['status'] {
  return status as TableRow<'vehicles'>['status'];
}

/**
 * Type-safe conversion for lease ID values
 */
export function asLeaseId(id: string): TableRow<'leases'>['id'] {
  return id as TableRow<'leases'>['id'];
}

/**
 * Type-safe conversion for vehicle ID values
 */
export function asVehicleId(id: string): TableRow<'vehicles'>['id'] {
  return id as TableRow<'vehicles'>['id'];
}

/**
 * Type-safe conversion for profile (customer) ID values
 */
export function asProfileId(id: string): TableRow<'profiles'>['id'] {
  return id as TableRow<'profiles'>['id'];
}
