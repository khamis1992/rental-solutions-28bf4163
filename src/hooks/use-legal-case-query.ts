
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useLegalCaseQuery = (caseId?: string) => {
  return useQuery({
    queryKey: ['legal-case', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });
};
