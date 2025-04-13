
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DbId, handleSupabaseResponse } from '@/lib/supabase-types';

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
