
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  showFirstLast = true,
}: PaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="flex items-center space-x-2">
        {/* First Page Button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
        )}
        
        {/* Previous Page Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {/* Page Numbers */}
        {pageNumbers.map((page, i) => (
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        ))}

        {/* Next Page Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>

        {/* Last Page Button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to generate page numbers with ellipsis
function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];

  // Always show first page
  pages.push(1);

  // Calculate start and end of the middle section
  let startMiddle = Math.max(2, currentPage - 1);
  let endMiddle = Math.min(totalPages - 1, currentPage + 1);

  // Adjust to always show 3 pages in the middle
  if (currentPage <= 3) {
    endMiddle = 4;
  } else if (currentPage >= totalPages - 2) {
    startMiddle = totalPages - 3;
  }

  // Add ellipsis if needed
  if (startMiddle > 2) {
    pages.push("...");
  }

  // Add the middle pages
  for (let i = startMiddle; i <= endMiddle; i++) {
    pages.push(i);
  }

  // Add ellipsis if needed
  if (endMiddle < totalPages - 1) {
    pages.push("...");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}
