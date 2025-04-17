
import { Database } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';

// Type aliases for common database types
type DbTables = Database['public']['Tables'];
type SchemaName = keyof Database;

// Helper function to cast string IDs to database-compatible types
export function castDbId<T = string>(id: string): T {
  return id as unknown as T;
}

// Helper function for Supabase queries that type-safely wraps the .eq() method
export function eqFilter(columnName: string, value: any) {
  return {
    column: columnName,
    operator: 'eq',
    value: value
  };
}

// Helper that creates a type-safe query builder
export const createTypedQuery = (tableName: string) => {
  return {
    select: (columns: string = '*') => supabase.from(tableName).select(columns),
    getById: (id: string) => supabase.from(tableName).select().eq('id', id as any),
    eq: (column: string, value: any) => supabase.from(tableName).select().eq(column, value as any),
    delete: (column: string, value: any) => supabase.from(tableName).delete().eq(column, value as any),
  };
};
