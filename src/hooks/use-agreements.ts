import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export interface SimpleAgreement {
  id: string;
  status: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  total_amount?: number;
  agreement_number?: string;
  agreement_type?: string;
  customer_name?: string;
  customers?: {
    id?: string;
    full_name?: string;
  };
  profiles?: {
    id?: string;
    full_name?: string;
  };
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    license_plate?: string;
  };
}

export function useAgreements(initialFilters = {}) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  // Function to get initial filters from URL parameters
  const getInitialFilters = () => {
    const filters: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    return filters;
  };

  const [filters, setFilters] = useState(getInitialFilters());

  // Function to update URL parameters based on filters
  const updateSearchParams = (newFilters: { [key: string]: string }) => {
    for (const key in newFilters) {
      if (newFilters[key] === undefined) {
        searchParams.delete(key);
      } else {
        searchParams.set(key, newFilters[key]);
      }
    }
    setSearchParams(searchParams);
    setFilters(newFilters);
  };

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery<SimpleAgreement[]>(
    ['agreements', filters],
    async () => {
      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `);

      // Apply filters from URL parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'customer_id') {
          query = query.eq('customer_id', value);
        } else if (key === 'status' && value !== 'all') {
          query = query.eq('status', value);
        } else if (key === 'agreement_number') {
          query = query.ilike('agreement_number', `%${value}%`);
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agreements:', error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      return data || [];
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const updateAgreement = async ({ id, data }: { id: string; data: Partial<Agreement> }) => {
    const { data: updatedAgreement, error } = await supabase
      .from('leases')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  
    if (error) {
      console.error('Error updating agreement:', error);
      throw error;
    }
  
    // Invalidate the cache for agreements to refetch the updated data
    await queryClient.invalidateQueries(['agreements']);
  
    return updatedAgreement;
  };

  const deleteAgreements = async (ids: string[]) => {
    const { error } = await supabase
      .from('leases')
      .delete()
      .in('id', ids);
  
    if (error) {
      console.error('Error deleting agreements:', error);
      throw error;
    }
  
    // Invalidate the cache for agreements to refetch the updated data
    await queryClient.invalidateQueries(['agreements']);
  };

  return {
    agreements: agreements || [],
    isLoading,
    error,
    updateAgreement,
    deleteAgreements,
    searchParams,
    setSearchParams: updateSearchParams,
    setFilters,
    customer,
    setCustomer,
  };
}
