import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService, customerService } from '@/services/CustomerService';
import { Customer, CustomerFilterParams } from '@/types/customer.types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/service.types';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface UseCustomerServiceOptions {
  filters?: CustomerFilterParams;
}

export function useCustomerService(options: UseCustomerServiceOptions = {}) {
  const queryClient = useQueryClient();

  // Always ensure filters is defined and search is present
  const [filters, setFilters] = useState<CustomerFilterParams>({ search: '', ...(options.filters || {}) });
  
  // Use error handler
  const { handleError } = useErrorHandler();

  const listCustomers = useCallback(async () => {
    try {
      const result = await customerService.fetchCustomers(filters);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'listCustomers', filters }
      });
      throw error;
    }
  }, [filters, handleError]);

  const getCustomer = useCallback(async (id: string) => {
    try {
      const result = await customerService.getCustomerById(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'getCustomer', customerId: id }
      });
      throw error;
    }
  }, [handleError]);

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    try {
      const result = await customerService.createCustomer(data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'createCustomer', data }
      });
      throw error;
    }
  }, [handleError]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    try {
      const result = await customerService.updateCustomer(id, data);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'updateCustomer', customerId: id, data }
      });
      throw error;
    }
  }, [handleError]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const result = await customerService.deleteCustomer(id);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'deleteCustomer', customerId: id }
      });
      throw error;
    }
  }, [handleError]);

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
      toast.success('تم إنشاء العميل بنجاح');
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'createCustomerMutation' }
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تحديث العميل بنجاح');
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'updateCustomerMutation' }
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم حذف العميل بنجاح');
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'customer', action: 'deleteCustomerMutation' }
      });
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
