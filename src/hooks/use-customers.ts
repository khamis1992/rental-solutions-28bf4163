
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CustomerService, Customer, CustomerFilterOptions } from '@/services/customers/customers-service';

export type { Customer } from '@/services/customers/customers-service';

export const useCustomers = (initialFilters: CustomerFilterOptions = {}) => {
  const [filterParams, setFilterParams] = useState<CustomerFilterOptions>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching customers with filters
  const {
    data: customers,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', filterParams],
    queryFn: () => CustomerService.fetchCustomers(filterParams),
    staleTime: 300000, // 5 minutes
    gcTime: 600000,    // 10 minutes
  });

  // Query for fetching a single customer
  const fetchCustomer = async (id: string): Promise<Customer | null> => {
    return await CustomerService.getCustomer(id);
  };

  // Mutation for creating a new customer
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const newCustomer = await CustomerService.createCustomer(customerData);
      if (!newCustomer) {
        throw new Error('Failed to create customer');
      }
      return newCustomer;
    },
    onSuccess: () => {
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create customer: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for updating a customer
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updatedCustomer = await CustomerService.updateCustomer(id, data);
      if (!updatedCustomer) {
        throw new Error('Failed to update customer');
      }
      return updatedCustomer;
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update customer: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for deleting a customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await CustomerService.deleteCustomer(id);
      if (!success) {
        throw new Error('Failed to delete customer');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete customer: ${error.message || 'Unknown error'}`);
    }
  });

  // Function to search for customers
  const searchCustomers = async (query: string): Promise<Customer[]> => {
    return await CustomerService.searchCustomers(query);
  };

  // Function to get a customer's agreements
  const getCustomerAgreements = async (customerId: string): Promise<any[]> => {
    return await CustomerService.getCustomerAgreements(customerId);
  };

  return {
    customers,
    isLoading,
    error,
    filterParams,
    setFilterParams,
    fetchCustomer,
    createCustomer: createCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    deleteCustomer: deleteCustomerMutation.mutateAsync,
    searchCustomers,
    getCustomerAgreements,
    refetchCustomers: refetch
  };
};
