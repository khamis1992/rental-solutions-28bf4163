
import { useState } from 'react';
import { useCustomerQuery, CustomerSearchParams } from './use-customer-query';
import { useCustomerMutations } from './use-customer-mutations';
import { useSingleCustomer } from './use-single-customer';

export const useCustomers = () => {
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>({
    query: '',
    status: 'all',
  });

  const { data: customers, isLoading, error, refetch: refreshCustomers } = useCustomerQuery(searchParams);
  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerMutations();
  const { getCustomer } = useSingleCustomer();

  return {
    customers: customers || [],
    isLoading,
    error,
    searchParams,
    setSearchParams,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    refreshCustomers,
  };
};
