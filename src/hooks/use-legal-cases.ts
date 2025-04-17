
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { castDbId } from '@/utils/database-type-helpers';

// Define LegalCase type
interface LegalCase {
  id: string;
  case_type: string;
  status: string;
  priority: string;
  customer_id: string;
  customer_name?: string;
  amount_owed?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  resolution_date?: string;
  resolution_notes?: string;
  assigned_to?: string;
}

export const useLegalCases = () => {
  const queryClient = useQueryClient();

  const { data: cases, isLoading, error } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('legal_cases')
          .select(`
            *,
            profiles:customer_id(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(item => {
          if (!item) return null;
          
          // Safely extract profile data
          const profileData = item.profiles && typeof item.profiles === 'object' ? item.profiles : {};
          const customerName = profileData && 'full_name' in profileData ? profileData.full_name : 'Unknown';
          
          return {
            id: item.id || '',
            case_type: item.case_type || '',
            status: item.status || '',
            priority: item.priority || '',
            customer_id: item.customer_id || '',
            customer_name: customerName || 'Unknown',
            amount_owed: item.amount_owed || 0,
            description: item.description || '',
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            resolution_date: item.resolution_date || '',
            resolution_notes: item.resolution_notes || '',
            assigned_to: item.assigned_to || ''
          };
        }).filter(Boolean) as LegalCase[];
      } catch (error) {
        console.error('Error fetching legal cases:', error);
        throw error;
      }
    }
  });

  const addCase = useMutation({
    mutationFn: async (newCase: Omit<LegalCase, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const { data, error } = await supabase
          .from('legal_cases')
          .insert([newCase] as any)
          .select();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error adding legal case:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Legal case added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error adding legal case: ${error.message}`);
    }
  });

  const updateCase = useMutation({
    mutationFn: async (updatedCase: Partial<LegalCase> & { id: string }) => {
      try {
        const { id, ...updateData } = updatedCase;
        const { data, error } = await supabase
          .from('legal_cases')
          .update(updateData as any)
          .eq('id', castDbId(id))
          .select();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating legal case:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Legal case updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error updating legal case: ${error.message}`);
    }
  });

  const deleteCase = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('legal_cases')
          .delete()
          .eq('id', castDbId(id));

        if (error) throw error;
        return id;
      } catch (error) {
        console.error('Error deleting legal case:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      toast.success('Legal case deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error deleting legal case: ${error.message}`);
    }
  });

  return {
    cases,
    isLoading,
    error,
    addCase: addCase.mutateAsync,
    updateCase: updateCase.mutateAsync,
    deleteCase: deleteCase.mutateAsync
  };
};
