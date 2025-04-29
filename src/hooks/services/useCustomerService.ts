
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerFilters } from '@/services/CustomerService';
import { toast } from 'sonner';

/**
 * Hook for working with the Customer Service
 */
export const useCustomerService = (initialFilters: CustomerFilters = {}) => {
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching customers with filters
  const {
    data: customersResult = { data: [], count: 0 },
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const result = await customerService.findCustomers(filters);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch customers');
      }
      return result.data;
    },
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes,
  });

  const customers = customersResult?.data || [];
  const customersCount = customersResult?.count || 0;

  // Batch update customers
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const result = await customerService.batchUpdate(ids, updates);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Batch update failed');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Customers updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error(`Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Batch delete customers
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await customerService.batchDelete(ids);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Batch delete failed');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Customers deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error(`Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Mutation for updating customer status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await customerService.updateStatus(id, status);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update customer status');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Mutation for checking document expiration
  const checkDocumentExpiration = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.checkDocumentExpiration(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to check document expiration');
      }
      return result.data;
    }
  });

  // Mutation for getting payment history
  const getPaymentHistory = useMutation({
    mutationFn: async (id: string) => {
      const result = await customerService.getPaymentHistory(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch payment history');
      }
      return result.data;
    }
  });

  return {
    customers,
    customersCount,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    getCustomerDetails: getCustomerDetails.mutateAsync,
    updateCustomer: updateCustomer.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    deleteCustomer: deleteCustomer.mutateAsync,
    checkDocumentExpiration: checkDocumentExpiration.mutateAsync,
    getPaymentHistory: getPaymentHistory.mutateAsync,
    batchUpdate: batchUpdateMutation.mutateAsync,
    batchDelete: batchDeleteMutation.mutateAsync,
    // Expose isPending states for UI loading indicators
    isPending: {
      getCustomerDetails: getCustomerDetails.isPending,
      updateCustomer: updateCustomer.isPending,
      updateStatus: updateStatus.isPending,
      deleteCustomer: deleteCustomer.isPending,
      checkDocumentExpiration: checkDocumentExpiration.isPending,
      getPaymentHistory: getPaymentHistory.isPending,
      batchUpdate: batchUpdateMutation.isPending,
      batchDelete: batchDeleteMutation.isPending,
    }
  };
};
