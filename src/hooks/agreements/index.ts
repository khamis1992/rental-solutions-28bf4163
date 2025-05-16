
import { useState } from 'react';
import { useAgreementFilters } from './use-agreement-filters';
import { useAgreementPagination } from './use-agreement-pagination';
import { useAgreementsQuery } from './use-agreements-query';
import { useAgreementMutations } from './use-agreement-mutations';
import { CustomerInfo } from '@/types/customer';
import { UseAgreementsResult } from './types';

export * from './types';

export function useAgreements(initialFilters = {}): UseAgreementsResult {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  
  // Setup filters using the extracted hook
  const { 
    filters, 
    setFilters, 
    updateSearchParams, 
    getInitialFilters 
  } = useAgreementFilters(initialFilters);
  
  // Setup pagination using the extracted hook
  const { 
    pagination, 
    setPagination, 
    totalCount,
    setTotalCount,
    getPaginationControls
  } = useAgreementPagination(Number(filters.page) || 1);
  
  // Get mutation methods
  const { updateAgreement, deleteAgreements } = useAgreementMutations();
  
  // Fetch agreements data
  const {
    data: agreementsData,
    isLoading,
    error,
    refetch
  } = useAgreementsQuery(filters, pagination, setTotalCount);

  // Generate pagination controls
  const paginationControls = getPaginationControls(filters, updateSearchParams);

  return {
    agreements: agreementsData?.data || [],
    isLoading,
    error,
    updateAgreement,
    deleteAgreements,
    searchParams: filters,
    setSearchParams: updateSearchParams,
    setFilters,
    customer,
    setCustomer,
    pagination: paginationControls,
    refetch
  };
}
