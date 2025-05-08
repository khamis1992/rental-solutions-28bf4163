
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { processAgreementData } from '@/components/agreements/table/agreement-data';
import { CustomerInfo } from '@/types/customer';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';

/**
 * Hook for fetching agreement data
 */
export function useAgreementData(filters, pagination, setTotalCount) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  const { data: agreements = [], isLoading, error } = useQuery({
    queryKey: ['agreements', filters, pagination],
    queryFn: async () => {
      // Build the query with filters and table aliases to avoid ambiguous column references
      let query = supabase.from('leases').select(`
        leases:id, leases:agreement_number, leases:status, leases:start_date, leases:end_date,
        leases:customer_id, leases:vehicle_id, leases:total_amount, leases:rent_amount,
        leases:payment_frequency, leases:deposit_amount, leases:created_at, leases:updated_at,
        leases:notes, leases:daily_late_fee,
        customers:profiles(id, full_name, email, phone_number),
        vehicles(id, make, model, year, license_plate, color, vehicle_type)
      `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('leases.status', filters.status);
      }

      if (filters.customer_id) {
        query = query.eq('leases.customer_id', filters.customer_id);
      }

      if (filters.searchTerm) {
        query = query.or(`leases.agreement_number.ilike.%${filters.searchTerm}%,vehicles.license_plate.ilike.%${filters.searchTerm}%`);
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
      
      if (hasData(response)) {
        // Set total count for pagination
        setTotalCount(response.count || 0);
        
        // Process and return the data
        return processAgreementData(response.data);
      }
      
      console.error("Error fetching agreements:", getErrorMessage(response));
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
