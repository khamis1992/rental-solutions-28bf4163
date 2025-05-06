
import { Database } from '@/types/database.types';

/**
 * Type-safe utility functions for working with database columns
 */

// Generic type for any database column
export type DbColumnValue<T extends keyof Database['public']['Tables'], K extends keyof Database['public']['Tables'][T]['Row']> = 
  Database['public']['Tables'][T]['Row'][K];

// Function to safely cast status values to their proper types
export function asColumnValue<
  T extends keyof Database['public']['Tables'], 
  K extends keyof Database['public']['Tables'][T]['Row']
>(tableName: T, columnName: K, value: unknown): DbColumnValue<T, K> {
  return value as DbColumnValue<T, K>;
}

// Commonly used column types
export type LeaseStatus = DbColumnValue<'leases', 'status'>;
export type PaymentStatus = DbColumnValue<'unified_payments', 'status'>;
export type TrafficFineStatus = DbColumnValue<'traffic_fines', 'payment_status'>;
export type VehicleId = DbColumnValue<'vehicles', 'id'>;
export type LeaseId = DbColumnValue<'leases', 'id'>;
export type CustomerId = DbColumnValue<'profiles', 'id'>;
export type PaymentId = DbColumnValue<'unified_payments', 'id'>;
export type TrafficFineId = DbColumnValue<'traffic_fines', 'id'>;

// Helper functions for common columns
export const asLeaseStatus = (value: string): LeaseStatus => 
  asColumnValue('leases', 'status', value);

export const asPaymentStatus = (value: string): PaymentStatus => 
  asColumnValue('unified_payments', 'status', value);

export const asTrafficFineStatus = (value: string): TrafficFineStatus => 
  asColumnValue('traffic_fines', 'payment_status', value);

export const asVehicleId = (value: string): VehicleId => 
  asColumnValue('vehicles', 'id', value);

export const asLeaseId = (value: string): LeaseId => 
  asColumnValue('leases', 'id', value);

export const asCustomerId = (value: string): CustomerId => 
  asColumnValue('profiles', 'id', value);

export const asPaymentId = (value: string): PaymentId =>
  asColumnValue('unified_payments', 'id', value);
