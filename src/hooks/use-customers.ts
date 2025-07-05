
import { useCustomerDataService } from './customers/useCustomerDataService';
import { useCustomerQueryService } from './customers/useCustomerQueryService';
import { useCustomerSearchState } from './customers/useCustomerSearchState';

export const useCustomers = () => {
  const { searchParams, setSearchParams } = useCustomerSearchState();
  const { customers, isLoading, error, refetch, getCustomer } = useCustomerQueryService(searchParams);
  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerDataService();

  const refreshCustomers = () => {
    return refetch();
  };

  return {
    customers,
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
