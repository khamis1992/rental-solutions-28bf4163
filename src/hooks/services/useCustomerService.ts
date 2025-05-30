import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService, CustomerFilters, Customer, customerService } from '@/services/CustomerService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/service.types';

interface UseCustomerServiceOptions {
  filters?: CustomerFilters;
}

export function useCustomerService(options: UseCustomerServiceOptions = {}) {
  const queryClient = useQueryClient();

  const listCustomers = useCallback(async () => {
    try {
      const result = await customerService.findCustomers(options.filters);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch customers: ${errorMessage}`);
      throw error;
    }
  }, [options.filters]);

  const getCustomer = useCallback(async (id: string) => {
    try {
      const result = await customerService.getCustomerDetails(id);
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
      const result = await customerService.create(data);
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
      const result = await customerService.update(id, data);
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
      const result = await customerService.delete(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to delete customer: ${errorMessage}`);
      throw error;
    }
  }, []);

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', options.filters],
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
    isLoadingCustomers,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    getCustomer,
  };
}
