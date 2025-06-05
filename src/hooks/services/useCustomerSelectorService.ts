
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/CustomerService';
import { CustomerInfo } from '@/types/customer';
import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/types/service.types';

export const useCustomerSelectorService = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customer-selector', searchQuery],
    queryFn: async () => {
      try {
        const result = await customerService.findCustomers({
          search: searchQuery.trim() || undefined,
          limit: 50 // Increase limit for better search results
        });
        
        if (!result.success) {
          console.error('Customer service error:', result.error);
          throw new Error(getErrorMessage(result.error));
        }
        
        // Transform to CustomerInfo format
        const transformedCustomers: CustomerInfo[] = (result.data || []).map(customer => ({
          id: customer.id,
          full_name: customer.name || customer.email || 'Unnamed Customer',
          email: customer.email || '',
          phone_number: customer.phone || '',
          driver_license: customer.driver_license || '',
          nationality: customer.nationality || '',
          address: customer.address || '',
          status: customer.status || 'active',
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          city: customer.city || '',
          state: customer.state || '',
          zip_code: customer.zip_code || '',
          role: 'customer'
        }));
        
        console.log('Transformed customers:', transformedCustomers);
        return transformedCustomers;
      } catch (error) {
        console.error('Error in useCustomerSelectorService:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
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
    customers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshCustomers,
    invalidateCustomerCache
  };
};
