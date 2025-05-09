
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { asAgreementId } from '@/utils/type-casting';

export interface SimpleAgreement {
  id: string;
  status: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string; 
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

interface PaginationOptions {
  page: number;
  pageSize: number;
}

export function useAgreements(initialFilters = {}) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: Number(searchParams.get('page')) || 1,
    pageSize: 12
  });
  
  const [totalCount, setTotalCount] = useState(0);

  // Function to get initial filters from URL parameters
  const getInitialFilters = () => {
    const params: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  // Initialize filters with URL params first, then override with initialFilters
  const [filters, setFilters] = useState({
    ...getInitialFilters(),
    ...initialFilters // This ensures initialFilters take precedence over URL params
  });

  // Function to update URL parameters based on filters
  const updateSearchParams = (newFilters: { [key: string]: string | undefined | number }) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update the URL parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        searchParams.delete(key);
        // Also remove from current filters
        delete updatedFilters[key];
      } else {
        searchParams.set(key, String(value));
      }
    });
    
    setSearchParams(searchParams);
    setFilters(updatedFilters);
    
    // Update pagination if page is included in filters
    if (newFilters.page !== undefined) {
      setPagination(prev => ({
        ...prev,
        page: Number(newFilters.page) || 1
      }));
    }
  };

  // Function to handle pagination changes
  const handlePaginationChange = (newPage: number, newPageSize?: number) => {
    setPagination(prev => ({
      page: newPage,
      pageSize: newPageSize || prev.pageSize
    }));
    
    // Update URL with new page
    updateSearchParams({ page: newPage });
  };

  const {
    data: agreementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agreements', filters, pagination],
    queryFn: async () => {
      console.log('Fetching agreements with filters:', filters);
      console.log('Pagination:', pagination);
      
      // Calculate offset based on current page and page size
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      // First, count total agreements with the current filters (without pagination)
      let countQuery = supabase
        .from('leases')
        .select('id', { count: 'exact' });
        
      // Apply filters to count query
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'customer_id') {
            countQuery = countQuery.eq('customer_id', value);
          } else if (key === 'status' && value !== 'all') {
            countQuery = countQuery.eq('status', value);
          } else if (key === 'agreement_number') {
            countQuery = countQuery.ilike('agreement_number', `%${value}%`);
          } else if (key === 'query') {
            // Enhanced search across multiple fields
            countQuery = countQuery.or(
              `agreement_number.ilike.%${value}%,vehicles.license_plate.ilike.%${value}%,profiles.full_name.ilike.%${value}%`
            );
          }
        }
      });
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting agreements:', countError);
        throw new Error(`Failed to count agreements: ${countError.message}`);
      }
      
      setTotalCount(count || 0);
      console.log(`Total agreements count: ${count}`);
      
      // Now fetch the actual data with pagination
      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .range(from, to);

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
          } else if (key === 'query') {
            // Enhanced search across multiple fields
            query = query.or(
              `agreement_number.ilike.%${value}%,vehicles.license_plate.ilike.%${value}%,profiles.full_name.ilike.%${value}%`
            );
          }
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agreements:', error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      console.log(`Fetched ${data?.length || 0} agreements`);
      return {
        data: data || [],
        count: count || 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

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
    agreements: agreementsData?.data || [],
    isLoading,
    error,
    updateAgreement,
    deleteAgreements,
    searchParams,
    setSearchParams: updateSearchParams,
    setFilters,
    customer,
    setCustomer,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize),
      handlePageChange: handlePaginationChange,
    }
  };
}
