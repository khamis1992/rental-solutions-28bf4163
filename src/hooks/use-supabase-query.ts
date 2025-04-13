
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DbId, handleSupabaseResponse } from '@/lib/supabase-types';
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
    return handleSupabaseResponse<T>(response);
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
      
      return handleSupabaseResponse<T[]>(response);
    },
    
    getById: async (id: string, columns: string = '*') => {
      const response = await supabase
        .from(tableName)
        .select(columns)
        .eq('id', asTableId(tableName, id))
        .single();
        
      return handleSupabaseResponse<T>(response);
    },
    
    filter: async (filters: Array<{ column: string, value: any }>, columns: string = '*') => {
      let query = supabase
        .from(tableName)
        .select(columns);
        
      for (const filter of filters) {
        query = query.eq(filter.column, filter.value);
      }
      
      const response = await query;
      return handleSupabaseResponse<T[]>(response);
    },
    
    // Helper method to safely check if response has data
    hasData: <R>(response: any): response is { data: R, error: null } => {
      return hasData(response);
    }
  };
}
