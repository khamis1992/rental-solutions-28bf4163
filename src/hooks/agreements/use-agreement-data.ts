
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { processAgreementData } from '@/components/agreements/table/agreement-data';
import { CustomerInfo } from '@/types/customer';
import { hasResponseData } from '@/utils/supabase-response-helpers';

/**
 * Hook for fetching agreement data
 */
export function useAgreementData(filters, pagination, setTotalCount) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  const { data: agreements = [], isLoading, error } = useQuery({
    queryKey: ['agreements', filters, pagination],
    queryFn: async () => {
      // Build the query with filters
      let query = supabase.from('leases').select(`
        *,
        customers:profiles(id, full_name, email, phone_number),
        vehicles(id, make, model, year, license_plate, color, vehicle_type)
      `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters.searchTerm) {
        query = query.or(`agreement_number.ilike.%${filters.searchTerm}%,license_plate.ilike.%${filters.searchTerm}%`);
      }

      // Apply pagination
      if (pagination) {
        const { pageSize, pageIndex } = pagination;
        const start = pageIndex * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);
      }

      // Execute the query
      const response = await query;
      
      if (hasResponseData(response)) {
        // Set total count for pagination
        setTotalCount(response.count || 0);
        
        // Process and return the data
        return processAgreementData(response.data);
      }
      
      console.error("Error fetching agreements:", response.error);
      return [];
    }
  });

  return {
    agreements,
    isLoading,
    error,
    customer,
    setCustomer
  };
}
