import { Database } from '@/types/database.types';
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { VehicleStatus } from '@/types/database.types';

// Main database types
export type DbDatabase = Database;
export type DbTables = Database['public']['Tables'];
export type Tables = DbTables; // Export Tables for backward // compatibility - removed unused variable// Only include tables that actually exist in the schema
export type DbTableName = keyof DbTables;

// Table row types for existing tables
export type TableRow<T extends DbTableName> = DbTables[T]['Row'];
export type TableInsert<T extends DbTableName> = DbTables[T]['Insert'];
export type TableUpdate<T extends DbTableName> = DbTables[T]['Update'];

// Specific table row types
export type LeaseRow = DbTables['leases']['Row'];
export type ProfileRow = DbTables['profiles']['Row'];
export type VehicleRow = DbTables['vehicles']['Row'];
export type UnifiedPaymentRow = DbTables['unified_payments']['Row'];
export type PaymentScheduleRow = DbTables['payment_schedules']['Row'];

// Response types
export type DbResponse<T> = PostgrestResponse<T>;
export type DbSingleResponse<T> = PostgrestSingleResponse<T>;
export type DbError = PostgrestError;

// List and single response helpers
export type DbListResponse<T> = {
  data: T[] | null;
  error: DbError | null;
};

export type DbItemResponse<T> = {
  data: T | null;
  error: DbError | null;
};

// Generic filter type
export type DbFilter<T extends DbTableName> = Partial<TableRow<T>>;

// Query options
export type DbQueryOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
};

// Common status types
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

// Re-export VehicleStatus from database types
export type { VehicleStatus };
