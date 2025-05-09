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
      try {
        // Build the query with filters and table aliases to avoid ambiguous column references
        let query = supabase.from('leases').select(`
          id, agreement_number, status, start_date, end_date,
          customer_id, vehicle_id, total_amount, rent_amount,
          payment_frequency, deposit_amount, created_at, updated_at,
          notes, daily_late_fee,
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
          // Apply the search filter correctly
          query = query.or(`agreement_number.ilike.%${filters.searchTerm}%,vehicles.license_plate.ilike.%${filters.searchTerm}%`);
        }

        // Apply pagination
        if (pagination) {
          const { pageSize, pageIndex } = pagination;
          const start = pageIndex * pageSize;
          const end = start + pageSize - 1;
          query = query.range(start, end);
        }

        // Add ordering by created_at for consistent results
        query = query.order('created_at', { ascending: false });

        // Execute the query
        const response = await query;

        if (hasData(response)) {
          // Set total count for pagination
          setTotalCount(response.count || 0);

          console.log("Agreements data from API:", response.data);

          // Process and return the data
          const processedData = processAgreementData(response.data);
          console.log("Processed agreements data:", processedData);
          return processedData;
        }

        console.error("Error fetching agreements:", getErrorMessage(response));
        return [];
      } catch (error) {
        console.error("Exception fetching agreements:", error);
        return [];
      }
    },
    // Refresh data every 60 seconds
    refetchInterval: 60000
  });

  return {
    agreements,
    isLoading,
    error,
    customer,
    setCustomer
  };
}
