
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { Database } from '@/types/database.types';
import { DbResponse, DbListResponse, DbSingleResponse } from './types';

// Define table-specific ID types
export type LeaseId = Database['public']['Tables']['leases']['Row']['id'];
export type VehicleId = Database['public']['Tables']['vehicles']['Row']['id'];
export type ProfileId = Database['public']['Tables']['profiles']['Row']['id'];
export type PaymentId = Database['public']['Tables']['unified_payments']['Row']['id'];
export type TrafficFineId = Database['public']['Tables']['traffic_fines']['Row']['id'];
export type MaintenanceId = Database['public']['Tables']['maintenance']['Row']['id'];

// Define table-specific status types
export type LeaseStatus = Database['public']['Tables']['leases']['Row']['status'];
export type VehicleStatus = Database['public']['Tables']['vehicles']['Row']['status'];
export type PaymentStatus = string; // Using string since it could be different types
export type ProfileStatus = Database['public']['Tables']['profiles']['Row']['status'];
export type MaintenanceStatus = Database['public']['Tables']['maintenance']['Row']['status'];

// Type-safe ID conversion functions
export function asLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

export function asVehicleId(id: string): VehicleId {
  return id as VehicleId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asPaymentId(id: string): PaymentId {
  return id as PaymentId;
}

export function asTrafficFineId(id: string): TrafficFineId {
  return id as TrafficFineId;
}

export function asMaintenanceId(id: string): MaintenanceId {
  return id as MaintenanceId;
}

// Type-safe status conversion functions
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asPaymentStatus(status: string): PaymentStatus {
  return status as PaymentStatus;
}

export function asProfileStatus(status: string): ProfileStatus {
  return status as ProfileStatus;
}

export function asMaintenanceStatus(status: string): MaintenanceStatus {
  return status as MaintenanceStatus;
}

// Add the function that was referenced but missing
export function asStatusColumn<T extends keyof Database['public']['Tables']>(
  status: string,
  _table?: T,
  _column?: string
): string {
  return status;
}

// Type-safe column value conversion
export function asTableColumn<
  T extends keyof Database['public']['Tables'],
  C extends keyof Database['public']['Tables'][T]['Row']
>(
  tableName: T,
  columnName: C,
  value: any
): Database['public']['Tables'][T]['Row'][C] {
  return value as Database['public']['Tables'][T]['Row'][C];
}

// Response data extraction with type safety
export function safelyExtractData<T>(response: any): T | null {
  if (response?.error) {
    console.error("Error in response:", response.error);
    return null;
  }
  return response?.data || null;
}

// Type guard for checking if a response has data
export function hasResponseData<T>(response: any): response is { data: T } {
  return !response?.error && response?.data !== null && response?.data !== undefined;
}

/**
 * Maps a Supabase response to a standardized DbResponse format
 */
export function mapDbResponse<T>(response: any): DbResponse<T> {
  if (response?.error) {
    return {
      data: null,
      error: response.error,
      status: 'error',
      message: response.error.message
    };
  }
  
  return {
    data: response?.data || null,
    error: null,
    status: 'success'
  };
}

// General function to handle database ID safely
export function asTableId(table: string, id: string): string {
  return id;
}
