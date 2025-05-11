
import { Database } from '@/types/database.types';
import { LeaseStatus, ValidationLeaseStatus, toValidationLeaseStatus } from '@/types/lease-types';

/**
 * Helper functions for type-safe database operations
 */

// Define generic helper for casting string IDs to database column types
export function asDatabaseColumn<T extends keyof Database['public']['Tables'], K extends keyof Database['public']['Tables'][T]['Row']>(
  tableName: T,
  columnName: K,
  value: string | null | undefined
): Database['public']['Tables'][T]['Row'][K] {
  return value as unknown as Database['public']['Tables'][T]['Row'][K];
}

// Specific helpers for commonly used IDs
export function asMaintenanceId(id: string | null | undefined): string {
  return id || '';
}

export function asVehicleId(id: string | null | undefined): string {
  return id || '';
}

export function asLeaseId(id: string | null | undefined): string {
  return id || '';
}

export function asCustomerId(id: string | null | undefined): string {
  return id || '';
}

export function asPaymentId(id: string | null | undefined): string {
  return id || '';
}

// Add missing asAgreementId
export function asAgreementId(id: string | null | undefined): string {
  return id || '';
}

// Status type helpers
export function asVehicleStatus(status: string | null | undefined): string {
  return status || 'available';
}

export function asLeaseStatus(status: string | null | undefined): string {
  return status || 'draft';
}

export function asPaymentStatus(status: string | null | undefined): string {
  return status || 'pending';
}

// Type guard for safely handling query results
export function isQueryDataValid<T>(data: any): data is T {
  return data !== null && 
         data !== undefined && 
         typeof data !== 'string' && 
         !('error' in data);
}

// Add missing ensureValidationLeaseStatus from lease-types.ts to avoid circular imports
export function ensureValidationLeaseStatus(status: string | null | undefined): ValidationLeaseStatus {
  if (!status) return 'draft';
  
  // This handles conversion from any LeaseStatus to a valid ValidationLeaseStatus
  // Including handling the 'completed' status
  if (status === 'completed') return 'closed';
  
  return toValidationLeaseStatus(status as LeaseStatus);
}

// Add a type-safe cast for using in database operations
export function asTypedDatabaseId<T extends string>(id: string | null | undefined): T {
  return (id || '') as T;
}
