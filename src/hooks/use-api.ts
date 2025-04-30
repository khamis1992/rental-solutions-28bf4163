import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useApiQuery = (key: string, queryFn: () => Promise<any>, options = {}) => {
  return useQuery([key], queryFn, options);
};

export const useApiMutation = (mutationFn: (variables: any) => Promise<any>, options = {}) => {
  return useMutation(mutationFn, options);
};
