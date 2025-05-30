
import { Database } from '@/types/database.types';

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

// Additional types for tables not in main schema
export type TrafficFineRow = {
  id: string;
  lease_id: string;
  fine_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRow = {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  status: string;
  created_at: string;
  updated_at: string;
};

// Status types
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

// ID types for better type safety
export type LeaseId = string;
export type ProfileId = string;
export type VehicleId = string;
export type PaymentId = string;
export type TrafficFineId = string;
export type MaintenanceId = string;

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

export function asTrafficFineId(id: string): TrafficFineId {
  return id as TrafficFineId;
}

export function asMaintenanceId(id: string): MaintenanceId {
  return id as MaintenanceId;
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

export function asTrafficFineStatus(status: string): string {
  return status;
}
