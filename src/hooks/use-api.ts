import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useApiQuery = (key: string, queryFn: () => Promise<any>, options = {}) => {
  return useQuery([key], queryFn, options);
};

export const useApiMutation = (mutationFn: (variables: any) => Promise<any>, options = {}) => {
  return useMutation(mutationFn, options);
};

export const useCrudApi = (tableName: string) => {
  const queryKey = [tableName];
  
  const getAll = () => useApiQuery(
    queryKey,
    async () => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return data;
    }
  );

  const create = useApiMutation(
    async (payload: any) => {
      const { data, error } = await supabase.from(tableName).insert(payload).select();
      if (error) throw error;
      return data;
    }
  );

  return { getAll, create };
};
