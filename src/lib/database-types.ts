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

// ID type helpers for better type safety
export type LeaseId = string;
export type ProfileId = string;
export type VehicleId = string;
export type PaymentId = string;

// Status enums from database
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';

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