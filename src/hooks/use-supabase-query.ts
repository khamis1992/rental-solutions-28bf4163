
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { asTableId } from '@/lib/uuid-helpers';
import { Database } from '@/types/database.types';
import { hasData } from '@/utils/supabase-type-helpers';

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

export const createSupabaseQuery = async <T>(
  tableName: string,
  query: (supabase: any) => Promise<any>
): Promise<T | null> => {
  try {
    const response = await query(supabase);
    return response.data as T;
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    return null;
  }
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
      
      if (!hasData(response)) {
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
        
      if (!hasData(response)) {
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
      
      if (!hasData(response)) {
        console.error('Error in Supabase query:', response.error);
        return null;
      }
      return response.data as T[];
    }
  };
}
