
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
  // Don't render pagination if there are no pages
  if (totalPages <= 0) {
    return null;
  }

  const handlePreviousClick = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Simple pagination that shows current page number out of total pages
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousClick}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <div className="flex items-center px-4 py-2 bg-background border rounded-md">
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextClick}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
