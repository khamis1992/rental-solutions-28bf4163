
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgreementPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AgreementPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: AgreementPaginationProps) {
  // Generate page numbers with ellipsis for long page ranges
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first page, last page, current page, and one page before and after current
    const pages: (number | string)[] = [1];
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span>Previous</span>
      </Button>
      
      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page, index) => (
          typeof page === 'string' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
