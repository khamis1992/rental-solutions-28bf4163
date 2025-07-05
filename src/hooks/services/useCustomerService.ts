import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService, customerService } from '@/services/CustomerService';
import { Customer, CustomerFilterParams } from '@/types/customer.types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/service.types';

interface UseCustomerServiceOptions {
  filters?: CustomerFilterParams;
}

export function useCustomerService(options: UseCustomerServiceOptions = {}) {
  const queryClient = useQueryClient();

  // Always ensure filters is defined and searchTerm is present
  const [filters, setFilters] = useState<CustomerFilterParams>({ searchTerm: '', ...(options.filters || {}) });

  const listCustomers = useCallback(async () => {
    try {
      const result = await customerService.fetchCustomers(filters);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch customers: ${errorMessage}`);
      throw error;
    }
  }, [filters]);

  const getCustomer = useCallback(async (id: string) => {
    try {
      const result = await customerService.getCustomerById(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch customer: ${errorMessage}`);
      throw error;
    }
  }, []);

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    try {
      const result = await customerService.createCustomer(data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to create customer: ${errorMessage}`);
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    try {
      const result = await customerService.updateCustomer(id, data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to update customer: ${errorMessage}`);
      throw error;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const result = await customerService.deleteCustomer(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to delete customer: ${errorMessage}`);
      throw error;
    }
  }, []);

  const {
    data: customers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', filters],
    queryFn: listCustomers,
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
  });

  return {
    customers,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    getCustomer,
  };
}
