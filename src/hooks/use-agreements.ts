import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Simplify agreement types to avoid excessive deep instantiation
interface Agreement {
  id: string;
  status: string;
  [key: string]: any;
}

interface SimpleAgreement {
  id: string;
  status: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_number?: string;
  [key: string]: any;
}

interface AgreementSearchParams {
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  search?: string;
}

const fetchAgreements = async (params?: AgreementSearchParams): Promise<SimpleAgreement[]> => {
  let query = supabase.from('leases').select('*');
  
  if (params) {
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.vehicle_id) {
      query = query.eq('vehicle_id', params.vehicle_id);
    }
    
    if (params.customer_id) {
      query = query.eq('customer_id', params.customer_id);
    }
    
    // Add any other filters as needed
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching agreements: ${error.message}`);
  }
  
  return data as SimpleAgreement[];
};

const fetchAgreementById = async (id: string): Promise<Agreement> => {
  const { data, error } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Agreement not found: ${error.message}`);
  }
  
  return data as Agreement;
};

const createAgreement = async (agreementData: Omit<Agreement, 'id'>): Promise<Agreement> => {
  const { data, error } = await supabase
    .from('leases')
    .insert([agreementData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating agreement: ${error.message}`);
  }

  return data as Agreement;
};

const updateAgreement = async (id: string, agreementData: Partial<Agreement>): Promise<Agreement> => {
  const { data, error } = await supabase
    .from('leases')
    .update(agreementData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating agreement: ${error.message}`);
  }

  return data as Agreement;
};

const deleteAgreement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('leases')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting agreement: ${error.message}`);
  }
};

export const useAgreements = (initialSearchParams: AgreementSearchParams = {}) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = React.useState<AgreementSearchParams>(initialSearchParams);

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery<SimpleAgreement[], Error>(
    ['agreements', searchParams],
    () => fetchAgreements(searchParams)
  );

  const createAgreementMutation = useMutation(createAgreement, {
    onSuccess: () => {
      queryClient.invalidateQueries(['agreements']);
    },
  });

  const updateAgreementMutation = useMutation(
    (variables: { id: string; data: Partial<Agreement> }) =>
      updateAgreement(variables.id, variables.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['agreements']);
      },
    }
  );

  const deleteAgreementMutation = useMutation(deleteAgreement, {
    onSuccess: () => {
      queryClient.invalidateQueries(['agreements']);
    },
  });

  return {
    // Return simplified objects
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    fetchAgreementById,
    createAgreement: createAgreementMutation.mutateAsync,
    updateAgreement: updateAgreementMutation.mutateAsync,
    deleteAgreement: deleteAgreementMutation.mutateAsync
  };
};
