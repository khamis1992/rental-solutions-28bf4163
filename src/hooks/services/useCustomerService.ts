
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerFilters } from '@/services/CustomerService';
import { toast } from 'sonner';
import { useState } from 'react';

export const useCustomerService = (filters: CustomerFilters = {}) => {
  const queryClient = useQueryClient();
  const [currentFilters, setCurrentFilters] = useState<CustomerFilters>(filters);

  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', currentFilters],
    queryFn: async () => {
      const result = await customerService.findCustomers(currentFilters);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to fetch customers';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.delete(id);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to delete customer';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete customer: ${errorMessage}`);
    }
  });

  const setFilters = (newFilters: CustomerFilters | ((prev: CustomerFilters) => CustomerFilters)) => {
    if (typeof newFilters === 'function') {
      setCurrentFilters(newFilters);
    } else {
      setCurrentFilters(newFilters);
    }
  };

  return {
    customers: customers || [],
    isLoading,
    error,
    filters: currentFilters,
    setFilters,
    refetch,
    isPending: deleteCustomerMutation.isPending,
    deleteCustomer: deleteCustomerMutation.mutateAsync
  };
};
