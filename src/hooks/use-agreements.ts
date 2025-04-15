
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agreement } from '@/types/agreement';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface UseAgreementsProps {
  status?: string;
}

export const useAgreements = ({ status }: UseAgreementsProps = {}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParamsState] = useSearchParams();
  const queryClient = useQueryClient();

  // Function to update the search parameters
  const setSearchParams = useCallback(
    (paramsFn: (prevState: URLSearchParams) => URLSearchParams) => {
      const newParams = paramsFn(new URLSearchParams(searchParams.toString()));
      navigate(`?${newParams.toString()}`);
    },
    [navigate, searchParams]
  );

  const getAgreements = async (): Promise<Agreement[]> => {
    let query = supabase
      .from('leases')
      .select(`
        *,
        customers (
          id,
          full_name,
          email,
          phone_number
        ),
        vehicles (
          id,
          make,
          model,
          license_plate
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data as Agreement[];
  };

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agreements', status],
    queryFn: getAgreements,
  });

  const createAgreement = useMutation({
    mutationFn: async (newAgreement: Omit<Agreement, 'id'>) => {
      const { data, error } = await supabase
        .from('leases')
        .insert([newAgreement])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating agreement:', error);
      toast.error(`Error: ${error.message || 'Failed to create agreement'}`);
    },
  });

  const updateAgreement = useMutation({
    mutationFn: async (updatedAgreement: Agreement) => {
      const { data, error } = await supabase
        .from('leases')
        .update(updatedAgreement)
        .eq('id', updatedAgreement.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating agreement:', error);
      toast.error(`Error: ${error.message || 'Failed to update agreement'}`);
    },
  });

  // Update or add the deleteAgreement mutation to handle both single ID and array of IDs
  const deleteAgreement = useMutation({
    mutationFn: async (id: string | string[]) => {
      // Handle both single ID and array of IDs
      if (Array.isArray(id)) {
        const { error } = await supabase.from('leases').delete().in('id', id);
        if (error) throw new Error(error.message);
        return id;
      } else {
        const { error } = await supabase.from('leases').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting agreement:', error);
      toast.error(`Error: ${error.message || 'Failed to delete agreement'}`);
    },
  });

  // Add a getAgreement function to get a single agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        customers (
          id,
          full_name,
          email,
          phone_number
        ),
        vehicles (
          id,
          make,
          model,
          license_plate
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching agreement:', error);
      return null;
    }

    return data as Agreement;
  };

  return {
    agreements,
    isLoading,
    error,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    searchParams,
    setSearchParams,
    getAgreement
  };
};
