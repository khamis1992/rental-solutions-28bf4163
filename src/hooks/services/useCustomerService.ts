
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerFilters } from '@/services/CustomerService';
import { toast } from 'sonner';

export const useCustomerService = (filters: CustomerFilters = {}) => {
  const queryClient = useQueryClient();

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const result = await customerService.findCustomers(filters);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.toString() || 'Failed to fetch customers';
        throw new Error(errorMessage);
      }
      return result.data;
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.delete(id);
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.toString() || 'Failed to delete customer';
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

  return {
    customers: customers || [],
    isLoading,
    error,
    deleteCustomer: deleteCustomerMutation.mutateAsync
  };
};
