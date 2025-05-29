
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerFilters } from '@/services/CustomerService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getErrorMessage } from '@/types/service.types';

export const useCustomerService = (filters: CustomerFilters = {}) => {
  const queryClient = useQueryClient();
  const [currentFilters, setCurrentFilters] = useState<CustomerFilters>(filters);

  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', currentFilters],
    queryFn: async () => {
      const result = await customerService.findCustomers(currentFilters);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.delete(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
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
