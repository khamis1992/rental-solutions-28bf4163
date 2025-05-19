import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AgreementTemplate {
  id: string;
  name: string;
}

export function useAgreementTemplates() {
  return useQuery({
    queryKey: ['agreementTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreement_templates')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as AgreementTemplate[];
    }
  });
}
