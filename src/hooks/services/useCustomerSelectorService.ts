
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/CustomerService';
import { CustomerInfo } from '@/types/customer';
import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/types/service.types';

export const useCustomerSelectorService = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-selector', searchQuery],
    queryFn: async () => {
      const result = await customerService.findCustomers({
        search: searchQuery.trim() || undefined,
        limit: 20
      });
      
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      
      // Transform to CustomerInfo format
      const transformedCustomers: CustomerInfo[] = (result.data || []).map(customer => ({
        id: customer.id,
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone_number: customer.phone_number || customer.phone || '',
        driver_license: customer.driver_license || '',
        nationality: customer.nationality || '',
        address: customer.address || '',
        status: customer.status,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }));
      
      return transformedCustomers;
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5 // 5 minutes
  });

  const refreshCustomers = useCallback(async () => {
    // Invalidate all customer-related queries
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    await queryClient.invalidateQueries({ queryKey: ['customer-selector'] });
    return refetch();
  }, [queryClient, refetch]);

  const invalidateCustomerCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer-selector'] });
  }, [queryClient]);

  return {
    customers: customers || [],
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshCustomers,
    invalidateCustomerCache
  };
};
