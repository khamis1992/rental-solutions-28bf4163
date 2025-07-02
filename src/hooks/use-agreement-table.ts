
import { useAgreements } from './use-agreements';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAgreementTable() {
  const queryClient = useQueryClient();
  const agreementsQuery = useAgreements();

  // Add missing deleteAgreements mutation
  const deleteAgreements = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return ids;
    },
    onSuccess: () => {
      toast.success('Agreements deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete agreements: ${error.message}`);
    }
  });

  // Add missing pagination (basic implementation)
  const pagination = {
    pageIndex: 0,
    pageSize: 10,
    total: agreementsQuery.agreements?.length || 0
  };

  // Fixed refetch function to accept no arguments
  const refetch = () => {
    return agreementsQuery.refetch();
  };

  return {
    ...agreementsQuery,
    deleteAgreements: deleteAgreements.mutateAsync,
    pagination,
    refetch
  };
}
