
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTrafficFineQuery = (fineId?: string) => {
  return useQuery({
    queryKey: ['traffic-fine', fineId],
    queryFn: async () => {
      if (!fineId) return null;
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('id', fineId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!fineId
  });
};
