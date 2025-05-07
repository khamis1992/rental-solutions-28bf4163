
import { useAgreementFilters } from './agreements/use-agreement-filters';
import { useAgreementPagination } from './agreements/use-agreement-pagination';
import { useAgreementData } from './agreements/use-agreement-data';
import { useAgreementMutations } from './agreements/use-agreement-mutations';
import { SimpleAgreement } from '@/types/agreement';

/**
 * Main hook for working with agreements
 * Combines filter, pagination, data and mutation hooks
 */
export function useAgreements(initialFilters = {}) {
  // Use smaller focused hooks
  const { filters, searchParams, setSearchParams } = useAgreementFilters(initialFilters);
  const { paginationData, setTotalCount, pagination } = useAgreementPagination();
  const { agreements, isLoading, error, customer, setCustomer } = useAgreementData(filters, pagination, setTotalCount);
  const { updateAgreement, deleteAgreements } = useAgreementMutations();

  return {
    agreements,
    isLoading,
    error,
    updateAgreement,
    deleteAgreements,
    searchParams,
    setSearchParams,
    setFilters: setSearchParams,
    customer,
    setCustomer,
    pagination: paginationData
  };
}

// Re-export SimpleAgreement for backwards compatibility
export type { SimpleAgreement };
