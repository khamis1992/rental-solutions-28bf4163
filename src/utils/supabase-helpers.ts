
import { Database } from '@/types/database.types';
import { asTableId } from '@/lib/database-helpers';

// Type-safe helpers for working with Supabase tables
export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type RowColumn<T extends TableName, K extends keyof Row<T>> = Row<T>[K];

// Type-safe status casting functions for common tables
export const asLeaseStatus = (status: string): Row<'leases'>['status'] => status as Row<'leases'>['status'];
export const asVehicleStatus = (status: string): Row<'vehicles'>['status'] => status as Row<'vehicles'>['status'];
export const asPaymentStatus = (status: string): Row<'unified_payments'>['status'] => status as Row<'unified_payments'>['status'];
export const asProfileStatus = (status: string): Row<'profiles'>['status'] => status as Row<'profiles'>['status'];
export const asTrafficFinePaymentStatus = (status: string): Row<'traffic_fines'>['payment_status'] => status as Row<'traffic_fines'>['payment_status'];

// Helper for handling Supabase response data safely
export function handleSupabaseResponse<T>(response: { data: T | null; error: any }): T | null {
  if (response.error) {
    console.error("Supabase response error:", response.error);
    return null;
  }
  return response.data;
}

// Safe type casting for IDs to help with TypeScript errors
export function castId(id: string, table: TableName): any {
  return id as any; // This helps circumvent TypeScript's strict checking when we know the ID is valid
}

// Constants for agreement statuses to ensure consistency
export const AGREEMENT_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  DRAFT: 'draft', 
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
} as const;

// Constants for payment statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PROCESSING: 'processing'
} as const;

// Helper functions for handling type-safe database queries
export function safelyGetProperty<T, K extends keyof T>(obj: T | null, key: K): T[K] | undefined {
  return obj ? obj[key] : undefined;
}

// Helper to safely extract data from Supabase responses
export function safelyExtractData<T>(response: { data: T | null, error: any }): T | null {
  if (response.error) {
    console.error("Database error:", response.error);
    return null;
  }
  return response.data;
}

// Helper to safely handle data from responses that may have errors
export function safelyMapData<T, R>(data: T | null, mapFn: (item: T) => R): R | null {
  if (!data) return null;
  return mapFn(data);
}
