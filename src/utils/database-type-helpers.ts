
import { Database } from "@/types/database.types";

type Tables = Database['public']['Tables'];

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
  value: string
): Tables[T]['Row'][K] {
  return value as Tables[T]['Row'][K];
}

/**
 * Common table ID casting functions
 */
export function asAgreementId(id: string): string {
  return asTableId('leases', id);
}

export function asLeaseId(id: string): string {
  return asTableId('leases', id);
}

export function asVehicleId(id: string): string {
  return asTableId('vehicles', id);
}

export function asLeaseIdColumn(id: string): string {
  return asColumnValue('unified_payments', 'lease_id', id);
}

export function asImportIdColumn(id: string): string {
  return asColumnValue('agreement_import_reverts', 'import_id', id);
}

export function asAgreementIdColumn(id: string): string {
  return asColumnValue('traffic_fines', 'agreement_id', id);
}

/**
 * Cast enums and statuses 
 */
export function asStatusColumn(
  status: string,
  table: keyof Tables,
  column: string
): string {
  return asColumnValue(table, column as any, status);
}

/**
 * Type guard to check if response has data
 */
export function hasResponseData<T>(
  response: { data: T | null; error: null } | { error: any }
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Extract error message from response
 */
export function getErrorMessage(error: any): string {
  return error?.message || 'An error occurred';
}
