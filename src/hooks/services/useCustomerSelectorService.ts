
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
      console.log('Fetching customers with search query:', searchQuery);
      
      try {
        const result = await customerService.findCustomers({
          search: searchQuery.trim() || undefined,
          limit: 20
        });
        
        console.log('Customer service result:', result);
        
        if (!result.success) {
          console.error('Customer service error:', result.error);
          throw new Error(getErrorMessage(result.error));
        }
        
        // Transform to CustomerInfo format
        const transformedCustomers: CustomerInfo[] = (result.data || []).map(customer => ({
          id: customer.id,
          full_name: customer.full_name || customer.name || '',
          email: customer.email || '',
          phone_number: customer.phone_number || customer.phone || '',
          driver_license: customer.driver_license || '',
          nationality: customer.nationality || '',
          address: customer.address || '',
          status: customer.status,
          created_at: customer.created_at,
          updated_at: customer.updated_at
        }));
        
        console.log('Transformed customers:', transformedCustomers);
        return transformedCustomers;
      } catch (error) {
        console.error('Error in customer selector service:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', failureCount, error);
      return failureCount < 3;
    }
  });

  const refreshCustomers = useCallback(async () => {
    console.log('Refreshing customers...');
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
