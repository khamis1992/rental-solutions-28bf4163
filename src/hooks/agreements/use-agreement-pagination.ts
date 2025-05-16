
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaginationState, PaginationControls, AgreementFilters } from './types';

export function useAgreementPagination(initialPage = 1, initialPageSize = 1000): {
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  totalCount: number;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  getPaginationControls: (searchParams: any, updateSearchParams: (newFilters: AgreementFilters) => void) => PaginationControls;
} {
  // Default to showing all agreements without pagination
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize
  });
  
  const [totalCount, setTotalCount] = useState(0);

  const getPaginationControls = (
    searchParams: any,
    updateSearchParams: (newFilters: AgreementFilters) => void
  ): PaginationControls => {
    // Function to handle pagination changes
    const handlePageChange = (newPage: number, newPageSize?: number) => {
      setPagination(prev => ({
        page: newPage,
        pageSize: newPageSize || prev.pageSize
      }));
      
      // Update URL with new page
      updateSearchParams({ page: newPage });
    };

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize),
      handlePageChange
    };
  };

  return {
    pagination,
    setPagination,
    totalCount,
    setTotalCount,
    getPaginationControls
  };
}
