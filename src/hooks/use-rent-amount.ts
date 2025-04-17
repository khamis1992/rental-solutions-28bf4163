
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRentAmount(agreementId: string, fallbackValue: number = 0) {
  const { data: rentAmount = fallbackValue, isLoading, error } = useQuery({
    queryKey: ['rent-amount', agreementId],
    queryFn: async () => {
      try {
        // Skip fetching if no agreement ID
        if (!agreementId) return fallbackValue;
        
        const { data, error } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('id', agreementId)
          .single();

        if (error) throw error;
        return Number(data.rent_amount) || fallbackValue;
      } catch (err) {
        console.error('Error fetching rent amount:', err);
        return fallbackValue;
      }
    },
    enabled: !!agreementId
  });

  return { rentAmount, isLoading, error };
}
