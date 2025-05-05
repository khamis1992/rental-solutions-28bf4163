
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerFilters } from '@/services/CustomerService';
import { toast } from 'sonner';
import { Customer } from '@/lib/validation-schemas/customer';

/**
 * Hook for working with the Customer Service
 */
export const useCustomerService = (initialFilters: CustomerFilters = {}) => {
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const queryClient = useQueryClient();

  console.log('useCustomerService - filters:', filters);

  // Query for fetching customers with filters
  const {
    data: customers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      console.log('Fetching customers with filters:', filters);
      const result = await customerService.findCustomers(filters);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch customers');
      }
      
      // Map the response to match the expected Customer type structure
      const mappedCustomers = result.data.map((customer: any): Customer => ({
        id: customer.id,
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone: customer.phone_number?.replace(/^\+974/, '') || '',
        driver_license: customer.driver_license || '',
        nationality: customer.nationality || '',
        address: customer.address || '',
        notes: customer.notes || '',
        status: customer.status || 'active',
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      }));
      
      console.log('Mapped customers:', mappedCustomers);
      return mappedCustomers;
    }
  });

  // Mutation for getting customer details
  const getCustomerDetails = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.getCustomerDetails(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch customer details');
      }
      return result.data;
    }
  });

  // Mutation for updating a customer
  const updateCustomer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const result = await customerService.update(id, data);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update customer');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for deleting a customer
  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.delete(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete customer');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    customers,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    getCustomerDetails: getCustomerDetails.mutate,
    updateCustomer: updateCustomer.mutate,
    deleteCustomer: deleteCustomer.mutate,
    isPending: {
      getCustomerDetails: getCustomerDetails.isPending,
      updateCustomer: updateCustomer.isPending,
      deleteCustomer: deleteCustomer.isPending
    }
  };
};
