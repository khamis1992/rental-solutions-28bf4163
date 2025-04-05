
import { useState } from 'react';

export interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  offset: number;
  pageIndex: number; // Add this property needed by use-vehicles-pagination
}

export interface UsePaginationResult {
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  totalPages: number;
}

export function usePagination({ 
  initialPage = 1, 
  initialPageSize = 10, 
  total = 0 
}: PaginationOptions = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Calculate total pages
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  
  // Calculate if we can go to next/prev pages
  const canNextPage = totalPages > 0 ? page < totalPages : true;
  const canPrevPage = page > 1;
  
  // Calculate offset for the current page (for SQL OFFSET)
  const offset = (page - 1) * pageSize;
  
  // pageIndex is zero-based, whereas page is 1-based
  const pageIndex = page - 1;
  
  const nextPage = () => {
    if (canNextPage) {
      setPage(p => p + 1);
    }
  };
  
  const prevPage = () => {
    if (canPrevPage) {
      setPage(p => p - 1);
    }
  };
  
  return {
    pagination: { page, pageSize, offset, pageIndex },
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    totalPages
  };
}
