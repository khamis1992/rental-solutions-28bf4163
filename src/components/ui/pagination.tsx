
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

interface PaginationProps extends React.ComponentProps<"nav"> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ 
  className, 
  currentPage, 
  totalPages, 
  onPageChange,
  ...props 
}: PaginationProps) => {
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, last page, current page and pages around it
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Handle ellipsis for pages before current
      if (startPage > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Add pages around current
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Handle ellipsis for pages after current
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      // Add last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <div className="flex flex-row items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
          })}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </button>
        
        {generatePageNumbers().map((pageNumber, index) => {
          if (pageNumber === 'ellipsis-start' || pageNumber === 'ellipsis-end') {
            return (
              <div key={`${pageNumber}-${index}`} className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            );
          }
          
          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber as number)}
              disabled={pageNumber === currentPage}
              className={buttonVariants({
                variant: pageNumber === currentPage ? "default" : "outline",
                size: "sm",
              })}
            >
              {pageNumber}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
          })}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </button>
      </div>
    </nav>
  );
};

Pagination.displayName = "Pagination"

// Export just what we need - we've replaced the individual components with our more streamlined implementation
export { Pagination }
