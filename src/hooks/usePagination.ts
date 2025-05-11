
import { useState } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  paginationParams: {
    limit: number;
    offset: number;
  };
}

export const usePagination = ({
  totalItems,
  initialPage = 1,
  itemsPerPage = 20
}: UsePaginationProps): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(itemsPerPage);
  
  // Ensure total pages is at least 1
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  
  // Ensure current page is within bounds
  const validatedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  if (validatedCurrentPage !== currentPage) {
    setCurrentPage(validatedCurrentPage);
  }
  
  const setPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };
  
  const setItemsPerPage = (count: number) => {
    setPerPage(count);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };
  
  const paginationParams = {
    limit: perPage,
    offset: (validatedCurrentPage - 1) * perPage
  };
  
  return {
    currentPage: validatedCurrentPage,
    totalPages,
    itemsPerPage: perPage,
    setPage,
    setItemsPerPage,
    paginationParams
  };
};
