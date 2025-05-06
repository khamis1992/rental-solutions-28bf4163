
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
  payment_frequency?: string;
  payment_day?: number;
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
    const params: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  // Initialize filters with URL params first, then override with initialFilters
  // This ensures direct initialFilters (like customer_id) take precedence
  const [filters, setFilters] = useState({
    ...getInitialFilters(),
    ...initialFilters // This ensures initialFilters (like customer_id) take precedence over URL params
  });

  // Function to update URL parameters based on filters
  const updateSearchParams = (newFilters: { [key: string]: string | undefined }) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update the URL parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        searchParams.delete(key);
        // Also remove from current filters
        delete updatedFilters[key];
      } else {
        searchParams.set(key, value);
      }
    });
    setSearchParams(searchParams);
    setFilters(updatedFilters);
  };

  const {
    data: agreements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agreements', filters],
    queryFn: async () => {
      console.log('Fetching agreements with filters:', filters);
      
      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `);

      // Apply filters, giving priority to direct filters (like customer_id)
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'customer_id') {
            query = query.eq('customer_id', value);
            console.log('Applied customer_id filter:', value);
          } else if (key === 'status' && value !== 'all') {
            query = query.eq('status', value);
          } else if (key === 'agreement_number') {
            query = query.ilike('agreement_number', `%${value}%`);
          }
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agreements:', error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      console.log(`Fetched ${data?.length || 0} agreements`);
      return data || [];
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

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
    await queryClient.invalidateQueries({ queryKey: ['agreements'] });
  
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
    await queryClient.invalidateQueries({ queryKey: ['agreements'] });
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
