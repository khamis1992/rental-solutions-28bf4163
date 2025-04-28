
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-1 mt-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handleFirst}
        disabled={currentPage === 1}
        className="hidden sm:flex"
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">First Page</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>
      
      {generatePageNumbers().map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="hidden sm:flex"
        >
          {page}
        </Button>
      ))}
      
      <span className="text-sm text-muted-foreground sm:hidden">
        {currentPage} / {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLast}
        disabled={currentPage === totalPages}
        className="hidden sm:flex"
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Last Page</span>
      </Button>
    </div>
  );
}

// Extended Pagination Components for the Simple List
export const PaginationContent = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => {
  return (
    <ul className={`flex flex-row items-center gap-1 ${className}`} {...props}>
      {children}
    </ul>
  );
};

export const PaginationItem = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) => {
  return <li className={className} {...props}>{children}</li>;
};

export const PaginationLink = ({
  className,
  isActive,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  isActive?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export const PaginationPrevious = ({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`gap-1 pl-2.5 ${className}`}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  );
};

export const PaginationNext = ({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`gap-1 pr-2.5 ${className}`}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
};

export const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center ${className}`}
      {...props}
    >
      <span className="text-muted-foreground">...</span>
    </span>
  );
};

export default Pagination;
