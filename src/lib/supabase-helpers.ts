
import { Database } from '@/types/database.types';
import { UUID } from './database-types';
import { getResponseData } from '@/utils/supabase-type-helpers';
import { supabase } from '@/lib/supabase';

// Define type aliases for common operations
export type DbSchema = Database['public'];
export type DbTables = DbSchema['Tables'];

export type TableRow<T extends keyof DbTables> = DbTables[T]['Row'];
export type TableInsert<T extends keyof DbTables> = DbTables[T]['Insert'];
export type TableUpdate<T extends keyof DbTables> = DbTables[T]['Update'];

// Helper type for database IDs that enforces UUID format
export type DbId = UUID;

// Common query builder for type-safe operations
export const createQuery = <T extends keyof DbTables>(tableName: T) => {
  return {
    findById: async (id: string): Promise<TableRow<T> | null> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return null;
      }

      return data as TableRow<T>;
    },

    create: async (values: TableInsert<T>): Promise<TableRow<T> | null> => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(values)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        return null;
      }

      return data as TableRow<T>;
    },

    update: async (id: string, values: TableUpdate<T>): Promise<TableRow<T> | null> => {
      const { data, error } = await supabase
        .from(tableName)
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return null;
      }

      return data as TableRow<T>;
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        return false;
      }

      return true;
    },

    find: async (query: Partial<TableRow<T>>): Promise<TableRow<T>[] | null> => {
      let builder = supabase.from(tableName).select('*');
      
      for (const [key, value] of Object.entries(query)) {
        builder = builder.eq(key, value);
      }

      const { data, error } = await builder;

      if (error) {
        console.error(`Error querying ${tableName}:`, error);
        return null;
      }

      return data as TableRow<T>[];
    }
  };
};

export type QueryBuilder<T extends keyof DbTables> = ReturnType<typeof createQuery<T>>;
