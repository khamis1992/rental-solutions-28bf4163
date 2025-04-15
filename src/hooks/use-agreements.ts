
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agreement } from '@/types/agreement';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { toast } from 'sonner';

export interface UseAgreementsProps {
  status?: string;
  customer_id?: string;
}

export const useAgreements = ({ status, customer_id }: UseAgreementsProps = {}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParamsState] = useSearchParams();
  const queryClient = useQueryClient();

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
        profiles (
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
    
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data as unknown as Agreement[];
  };

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agreements', status, customer_id],
    queryFn: getAgreements,
  });

  const createAgreement = useMutation({
    mutationFn: async (newAgreement: Omit<Agreement, 'id'>) => {
      const { data, error } = await supabase
        .from('leases')
        .insert([newAgreement as any])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Agreement;
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
        .update(updatedAgreement as any)
        .eq('id', updatedAgreement.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Agreement;
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

  const deleteAgreement = useMutation({
    mutationFn: async (id: string | string[]) => {
      if (Array.isArray(id)) {
        const { error } = await supabase.from('leases').delete().in('id', id as any);
        if (error) throw new Error(error.message);
        return id;
      } else {
        const { error } = await supabase.from('leases').delete().eq('id', id as any);
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

  const getAgreement = async (id: string): Promise<Agreement | null> => {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        profiles (
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

    return data as unknown as Agreement;
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

export type SimpleAgreement = {
  id: string;
  status: string;
  agreement_number?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  vehicles?: {
    make?: string;
    model?: string;
    license_plate?: string;
  };
};
