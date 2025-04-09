
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Simplify agreement types to avoid excessive deep instantiation
export interface SimpleAgreement {
  id: string;
  status: string;
  customer_id?: string;
  vehicle_id?: string;
  agreement_number?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  total_amount?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: any;
}

export interface AgreementSearchParams {
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

const fetchAgreementById = async (id: string): Promise<SimpleAgreement> => {
  const { data, error } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Agreement not found: ${error.message}`);
  }
  
  return data as SimpleAgreement;
};

const createAgreement = async (agreementData: any): Promise<SimpleAgreement> => {
  const { data, error } = await supabase
    .from('leases')
    .insert([agreementData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating agreement: ${error.message}`);
  }

  return data as SimpleAgreement;
};

const updateAgreement = async (id: string, agreementData: any): Promise<SimpleAgreement> => {
  const { data, error } = await supabase
    .from('leases')
    .update(agreementData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating agreement: ${error.message}`);
  }

  return data as SimpleAgreement;
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
  const [searchParams, setSearchParams] = useState<AgreementSearchParams>(initialSearchParams);

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: () => fetchAgreements(searchParams)
  });

  const createAgreementMutation = useMutation({
    mutationFn: createAgreement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const updateAgreementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateAgreement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const deleteAgreementMutation = useMutation({
    mutationFn: deleteAgreement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  // Return both new and old method names for backward compatibility
  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    // New methods
    fetchAgreementById,
    createAgreement: createAgreementMutation.mutateAsync,
    updateAgreement: updateAgreementMutation.mutateAsync,
    deleteAgreement: deleteAgreementMutation.mutateAsync,
    // Legacy methods
    getAgreement: fetchAgreementById,
    useList: () => ({ data: agreements, isLoading, error }),
  };
};
