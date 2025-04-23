
import { Tables, TableRow, TableInsert, TableUpdate, UUID } from './database-types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

export * from './database-types';

// Type-safe query builder
export const createQuery = <T extends keyof Tables>(tableName: T) => {
  return {
    findById: async (id: UUID): Promise<TableRow<T> | null> => {
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

    update: async (id: UUID, values: TableUpdate<T>): Promise<TableRow<T> | null> => {
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

    delete: async (id: UUID): Promise<boolean> => {
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

export type QueryBuilder<T extends keyof Tables> = ReturnType<typeof createQuery<T>>;

