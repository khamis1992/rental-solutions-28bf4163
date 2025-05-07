
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { asAgreementId } from '@/utils/type-casting';
import { CustomerInfo } from '@/types/customer';

/**
 * Hook for fetching and managing agreement data
 */
export function useAgreementData(
  filters: { [key: string]: string },
  pagination: { page: number; pageSize: number },
  setTotalCount: (count: number) => void
) {
  const queryClient = useQueryClient();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  // Fetch agreements with filters and pagination
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

  return {
    agreements: agreementsData?.data || [],
    isLoading,
    error,
    customer,
    setCustomer
  };
}
