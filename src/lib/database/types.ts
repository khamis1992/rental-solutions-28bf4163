
import { Database } from '@/types/database.types';
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

// Main database types
export type DbDatabase = Database;
export type DbTables = Database['public']['Tables'];

// Only include tables that actually exist in the schema
export type DbTableName = keyof DbTables;

// Table row types for existing tables
export type TableRow<T extends DbTableName> = DbTables[T]['Row'];
export type TableInsert<T extends DbTableName> = DbTables[T]['Insert'];
export type TableUpdate<T extends DbTableName> = DbTables[T]['Update'];

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
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
