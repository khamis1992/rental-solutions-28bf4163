import { useState, useMemo, useCallback } from 'react';

export interface PaginationConfig {
  pageSize: number;
  initialPage?: number;
  maxPagesToShow?: number;
}

export interface PaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: T[];
  startIndex: number;
  endIndex: number;
  
  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  
  // Pagination info for UI
  pageNumbers: number[];
  showFirstPage: boolean;
  showLastPage: boolean;
  showPreviousEllipsis: boolean;
  showNextEllipsis: boolean;
}

export const usePagination = <T>(
  data: T[],
  config: PaginationConfig
): PaginationResult<T> => {
  const { pageSize: initialPageSize, initialPage = 1, maxPagesToShow = 5 } = config;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Memoized calculations
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);
  
  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems);
  }, [startIndex, pageSize, totalItems]);
  
  const items = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);
  
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  
  // Calculate visible page numbers
  const pageNumbers = useMemo(() => {
    const delta = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxPagesToShow]);
  
  const showFirstPage = pageNumbers[0] > 1;
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages;
  const showPreviousEllipsis = pageNumbers[0] > 2;
  const showNextEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

  // Actions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);
  
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);
  
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    // Reset to first page when page size changes
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    items,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    pageNumbers,
    showFirstPage,
    showLastPage,
    showPreviousEllipsis,
    showNextEllipsis,
  };
};

// Hook للـ Server-side pagination
export interface ServerPaginationConfig {
  pageSize: number;
  initialPage?: number;
}

export interface ServerPaginationResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  
  // For query params
  offset: number;
  limit: number;
}

export const useServerPagination = (
  totalItems: number,
  config: ServerPaginationConfig,
  onPageChange?: (page: number, pageSize: number) => void
): ServerPaginationResult => {
  const { pageSize: initialPageSize, initialPage = 1 } = config;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  
  const offset = (currentPage - 1) * pageSize;
  const limit = pageSize;

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      onPageChange?.(page, pageSize);
    }
  }, [totalPages, pageSize, onPageChange]);
  
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, pageSize);
    }
  }, [hasNextPage, currentPage, pageSize, onPageChange]);
  
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, pageSize);
    }
  }, [hasPreviousPage, currentPage, pageSize, onPageChange]);
  
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
    onPageChange?.(1, size);
  }, [onPageChange]);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    offset,
    limit,
  };
}; 