
import { useState } from 'react';

interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Hook for managing agreement pagination
 */
export function useAgreementPagination() {
  // Default pagination values
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 10
  });
  
  const [totalCount, setTotalCount] = useState(0);

  // Function to handle pagination changes
  const handlePaginationChange = (newPage: number, newPageSize?: number) => {
    setPagination(prev => ({
      page: newPage,
      pageSize: newPageSize || prev.pageSize
    }));
  };

  return {
    pagination,
    totalCount,
    setTotalCount,
    setPagination,
    handlePaginationChange,
    paginationData: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize),
      handlePageChange: handlePaginationChange,
    }
  };
}
