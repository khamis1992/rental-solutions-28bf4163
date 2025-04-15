
import { Database } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';

// Type aliases for common database types
type DbTables = Database['public']['Tables'];
type SchemaName = keyof Database;

// Type-safe helpers for ID columns
export type LeaseId = DbTables['leases']['Row']['id'];
export type PaymentId = DbTables['unified_payments']['Row']['id'];
export type AgreementId = DbTables['leases']['Row']['id'];
export type VehicleId = DbTables['vehicles']['Row']['id'];
export type CustomerId = DbTables['profiles']['Row']['id'];
export type TrafficFineId = DbTables['traffic_fines']['Row']['id'];

/**
 * Type-safe query function for table operations
 */
export function createTableQuery<T extends keyof DbTables>(tableName: T) {
  return {
    select: () => supabase.from(tableName).select(),
    getById: (id: string) => supabase.from(tableName).select().eq('id', id).single(),
    insert: (data: DbTables[T]['Insert']) => supabase.from(tableName).insert(data),
    update: (id: string, data: DbTables[T]['Update']) => 
      supabase.from(tableName).update(data).eq('id', id),
    delete: (id: string) => supabase.from(tableName).delete().eq('id', id),
  };
}

/**
 * Helper to ensure typesafe column comparisons
 */
export function columnEq<T extends keyof DbTables, C extends keyof DbTables[T]['Row']>(
  column: C, 
  value: DbTables[T]['Row'][C]
) {
  return { column, value };
}

/**
 * Safe extraction of Supabase response data
 */
export function getResponseData<T>(response: { data: T | null, error: any }): T | null {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return null;
  }
  return response.data;
}
