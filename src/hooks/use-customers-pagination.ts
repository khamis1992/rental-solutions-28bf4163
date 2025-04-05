
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { PaginationState } from '@/hooks/use-pagination';

export interface UseCustomersListOptions {
  status?: string;
  query?: string;
  pagination?: PaginationState;
  enabled?: boolean;
}

export function useCustomersList({
  status = 'all',
  query = '',
  pagination = { page: 1, pageSize: 10, offset: 0 },
  enabled = true
}: UseCustomersListOptions = {}) {
  return useQuery({
    queryKey: ['customers', status, query, pagination],
    queryFn: async () => {
      console.log(`Fetching customers with pagination: page=${pagination.page}, size=${pagination.pageSize}, offset=${pagination.offset}`);
      
      try {
        // First get the total count for pagination
        const countQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'customer');
        
        if (status !== 'all') {
          countQuery.eq('status', status);
        }
        
        if (query) {
          countQuery.or(
            `full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%,driver_license.ilike.%${query}%`
          );
        }

        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error counting customers:', countError);
          throw countError;
        }
        
        // Now fetch the paginated data
        let dataQuery = supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, driver_license, nationality, address, notes, status, created_at, updated_at')
          .eq('role', 'customer')
          .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
          .order('created_at', { ascending: false });
        
        if (status !== 'all') {
          dataQuery = dataQuery.eq('status', status);
        }
        
        if (query) {
          dataQuery = dataQuery.or(
            `full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%,driver_license.ilike.%${query}%`
          );
        }
        
        const { data, error } = await dataQuery;
        
        if (error) {
          console.error('Error fetching customers:', error);
          throw error;
        }

        const processedCustomers = (data || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: (profile.phone_number || '').replace(/^\+974/, '').trim(),
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: (profile.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment",
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }));

        return {
          data: processedCustomers,
          count: count || 0
        };

      } catch (error) {
        console.error('Error in useCustomersList:', error);
        throw error;
      }
    },
    enabled,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });
}
