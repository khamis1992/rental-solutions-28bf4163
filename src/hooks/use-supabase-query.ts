
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { hasResponseData } from '@/utils/supabase-type-helpers';

// Define helper types for improved type safety
type DbTables = Database['public']['Tables'];
type TableName = keyof DbTables;

export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<T | null>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    retry?: boolean | number;
  }
): UseQueryResult<T | null, Error> => {
  return useQuery({
    queryKey: key,
    queryFn,
    ...options,
  });
};

export const useSupabaseMutation = <T>(
  mutationFn: (data: any) => Promise<T | null>
) => {
  return useMutation({
    mutationFn,
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });
};

/**
 * Type-safe helper for creating Supabase filters
 */
export function createFilter<T extends keyof any>(
  column: T, 
  value: any
): { column: T, value: any } {
  return { column, value };
}

/**
 * Create a type-safe Supabase query builder
 */
export function createTypedQuery<T, TableName extends keyof Database['public']['Tables']>(tableName: TableName) {
  return {
    select: async (columns: string = '*') => {
      const response = await supabase
        .from(tableName)
        .select(columns);
      
      if (!hasResponseData(response)) {
        console.error('Error in Supabase query:', response.error);
        return null;
      }
      return response.data as T[];
    },
    
    getById: async (id: string, columns: string = '*') => {
      const response = await supabase
        .from(tableName)
        .select(columns)
        .eq('id', id)
        .single();
        
      if (!hasResponseData(response)) {
        console.error('Error in Supabase query:', response.error);
        return null;
      }
      return response.data as T;
    },
    
    filter: async (filters: Array<{ column: string, value: any }>, columns: string = '*') => {
      let query = supabase
        .from(tableName)
        .select(columns);
        
      for (const filter of filters) {
        query = query.eq(filter.column, filter.value);
      }
      
      const response = await query;
      
      if (!hasResponseData(response)) {
        console.error('Error in Supabase query:', response.error);
        return null;
      }
      return response.data as T[];
    }
  };
}
