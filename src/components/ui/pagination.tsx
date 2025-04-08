
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showEdges?: boolean;
  maxDisplayPages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showEdges = true,
  maxDisplayPages = 5
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxDisplayPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxDisplayPages - 3);
    
    if (endPage - startPage < maxDisplayPages - 3) {
      startPage = Math.max(2, endPage - (maxDisplayPages - 3));
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if not already included
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages.map((page, index) => {
      if (page === '...') {
        return <span key={`ellipsis-${index}`} className="px-2">...</span>;
      }
      
      return (
        <Button
          key={`page-${page}`}
          variant={currentPage === page ? 'default' : 'outline'}
          onClick={() => handlePageChange(page as number)}
          className="h-8 w-8 p-0 text-sm"
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {showEdges && (
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <span className="sr-only">Previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex items-center space-x-1">
        {renderPageNumbers()}
      </div>
      
      {showEdges && (
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span className="sr-only">Next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
