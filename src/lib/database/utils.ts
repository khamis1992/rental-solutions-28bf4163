
import { Tables, TableRow, isSuccessResponse, DbResponse, DbListResponse, DbSingleResponse, exists } from './types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Type-safe ID casting for database tables
 */
export function asTableId<T extends keyof Tables>(
  _table: T,
  id: string | null | undefined
): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

/**
 * Common table ID casting functions
 */
export function asLeaseId(id: string): string {
  return asTableId('leases', id);
}

export function asVehicleId(id: string): string {
  return asTableId('vehicles', id);
}

export function asProfileId(id: string): string {
  return asTableId('profiles', id);
}

export function asPaymentId(id: string): string {
  return asTableId('unified_payments', id);
}

export function asTrafficFineId(id: string): string {
  return asTableId('traffic_fines', id);
}

export function asMaintenanceId(id: string): string {
  return asTableId('maintenance', id);
}

/**
 * Cast a value to a table's column type
 */
export function asTableColumn<T extends keyof Tables, K extends keyof TableRow<T>>(
  _table: T,
  _column: K,
  value: unknown
): TableRow<T>[K] {
  return value as TableRow<T>[K];
}

/**
 * Common status casting functions
 */
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asPaymentStatus(status: string): string {
  return status;
}

export function asVehicleStatus(status: string): Tables['vehicles']['Row']['status'] {
  return status as Tables['vehicles']['Row']['status'];
}

export function asProfileStatus(status: string): Tables['profiles']['Row']['status'] {
  return status as Tables['profiles']['Row']['status'];
}

export function asMaintenanceStatus(status: string): Tables['maintenance']['Row']['status'] {
  return status as Tables['maintenance']['Row']['status'];
}

/**
 * Convert a raw response to a standardized database response
 */
export function mapDbResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): DbResponse<T> {
  if (isSuccessResponse(response)) {
    return {
      data: response.data,
      error: null,
      status: 'success'
    };
  }
  
  return {
    data: null,
    error: new Error(response.error?.message || 'Unknown database error'),
    status: 'error',
    message: response.error?.message
  };
}

/**
 * Safely handle database row access with proper typecasting
 */
export function safelyGetValue<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!exists(obj)) return defaultValue;
  return obj[key] ?? defaultValue;
}
