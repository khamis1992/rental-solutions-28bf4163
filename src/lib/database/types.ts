// Unified database types - consolidating database type definitions
import { Database } from '@/integrations/supabase/types';

// Main database type
export type DbDatabase = Database;
export type DbTables = Database['public']['Tables'];

// Available table names - only include tables that exist in the schema
export type DbTableName = keyof DbTables;

// Core table types
export type LeaseRow = DbTables['leases']['Row'];
export type ProfileRow = DbTables['profiles']['Row'];
export type VehicleRow = DbTables['vehicles']['Row'];
export type UnifiedPaymentRow = DbTables['unified_payments']['Row'];
export type PaymentScheduleRow = DbTables['payment_schedules']['Row'];

// Status types
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

// ID types for better type safety
export type LeaseId = string;
export type ProfileId = string;
export type VehicleId = string;
export type PaymentId = string;

// Helper functions to cast strings to proper ID types
export function asLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asVehicleId(id: string): VehicleId {
  return id as VehicleId;
}

export function asPaymentId(id: string): PaymentId {
  return id as PaymentId;
}

// Helper functions to cast strings to proper status types
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asPaymentStatus(status: string): PaymentStatus {
  return status as PaymentStatus;
}