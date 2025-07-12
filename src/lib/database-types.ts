import { Database } from '@/integrations/supabase/types';

// Re-export the main database type
export type { Database };

// Specific table types for better type safety
export type LeaseRow = Database['public']['Tables']['leases']['Row'];
export type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
export type LeaseUpdate = Database['public']['Tables']['leases']['Update'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export type UnifiedPaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type UnifiedPaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type UnifiedPaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];

export type PaymentScheduleRow = Database['public']['Tables']['payment_schedules']['Row'];
export type PaymentScheduleInsert = Database['public']['Tables']['payment_schedules']['Insert'];
export type PaymentScheduleUpdate = Database['public']['Tables']['payment_schedules']['Update'];

// Add traffic fines and other missing table types - using generic approach since they're not in schema
export type TrafficFineRow = {
  id: string;
  lease_id: string;
  fine_amount: number;
  fine_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRow = {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  maintenance_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

// ID type helpers for better type safety
export type LeaseId = string;
export type ProfileId = string;
export type VehicleId = string;
export type PaymentId = string;
export type TrafficFineId = string;
export type MaintenanceId = string;

// Status enums from database
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

// Re-export VehicleStatus from database types
export type { VehicleStatus };

// Helper function to cast strings to proper ID types
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
