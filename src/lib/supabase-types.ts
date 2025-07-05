import { Database } from '@/types/database.types';

// Re-export main database type
export type { Database };

// Table types for type safety
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Row types for each table
export type LeaseRow = Tables['leases']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type UnifiedPaymentRow = Tables['unified_payments']['Row'];
export type PaymentScheduleRow = Tables['payment_schedules']['Row'];

// Insert types
export type LeaseInsert = Tables['leases']['Insert'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type VehicleInsert = Tables['vehicles']['Insert'];
export type UnifiedPaymentInsert = Tables['unified_payments']['Insert'];
export type PaymentScheduleInsert = Tables['payment_schedules']['Insert'];

// Update types
export type LeaseUpdate = Tables['leases']['Update'];
export type ProfileUpdate = Tables['profiles']['Update'];
export type VehicleUpdate = Tables['vehicles']['Update'];
export type UnifiedPaymentUpdate = Tables['unified_payments']['Update'];
export type PaymentScheduleUpdate = Tables['payment_schedules']['Update'];

// Custom types for tables not in main schema (like traffic_fines)
export type TrafficFineRow = {
  id: string;
  lease_id: string;
  fine_amount: number;
  fine_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type TrafficFineInsert = Omit<TrafficFineRow, 'id' | 'created_at' | 'updated_at'>;
export type TrafficFineUpdate = Partial<TrafficFineInsert>;

// Helper function to get table type
export function getTableType<T extends TableName>(tableName: T): Tables[T] {
  // This is a type helper function
  return {} as Tables[T];
}

// Status enums
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
