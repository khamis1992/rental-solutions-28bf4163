
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { asAgreementId } from '@/utils/type-casting';

/**
 * Hook for agreement mutations (update, delete)
 */
export function useAgreementMutations() {
  const queryClient = useQueryClient();

  const updateAgreement = async ({ id, data }: { id: string; data: Partial<Agreement> }) => {
    const { data: updatedAgreement, error } = await supabase
      .from('leases')
      .update(data)
      .eq('id', asAgreementId(id))
      .select()
      .single();
  
    if (error) {
      console.error('Error updating agreement:', error);
      throw error;
    }
  
    // Invalidate the cache for agreements to refetch the updated data
    await queryClient.invalidateQueries({ queryKey: ['agreements'] });
  
    return updatedAgreement;
  };

  const deleteAgreements = async (ids: string[]) => {
    const { error } = await supabase
      .from('leases')
      .delete()
      .in('id', ids.map(id => asAgreementId(id)));
  
    if (error) {
      console.error('Error deleting agreements:', error);
      throw error;
    }
  
    // Invalidate the cache for agreements to refetch the updated data
    await queryClient.invalidateQueries({ queryKey: ['agreements'] });
  };

  return {
    updateAgreement,
    deleteAgreements
  };
}
