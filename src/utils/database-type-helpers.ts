
import { Database } from '@/types/database.types';

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

// Type guard for safely handling query results
export function isQueryDataValid<T>(data: any): data is T {
  return data !== null && 
         data !== undefined && 
         typeof data !== 'string' && 
         !('error' in data);
}
