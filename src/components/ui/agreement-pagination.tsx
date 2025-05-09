
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
  // This component now uses the same pattern as SimplePagination
  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={goToPrevious}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      
      <div className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={goToNext}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
