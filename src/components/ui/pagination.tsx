import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageNumbers: number[];
  showFirstPage: boolean;
  showLastPage: boolean;
  showPreviousEllipsis: boolean;
  showNextEllipsis: boolean;
  className?: string;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showInfo?: boolean;
  itemName?: string;
  itemNamePlural?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  pageNumbers,
  showFirstPage,
  showLastPage,
  showPreviousEllipsis,
  showNextEllipsis,
  className,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showInfo = true,
  itemName = "عنصر",
  itemNamePlural = "عناصر"
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div className={cn(
      "flex flex-col gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
      "md:flex-row md:items-center md:justify-between",
      className
    )}>
      {/* معلومات النتائج */}
      {showInfo && (
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            عرض {startItem.toLocaleString('ar-QA')} إلى {endItem.toLocaleString('ar-QA')} من {totalItems.toLocaleString('ar-QA')} {totalItems === 1 ? itemName : itemNamePlural}
          </span>
          
          {/* اختيار حجم الصفحة */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">عرض</span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="whitespace-nowrap">لكل صفحة</span>
            </div>
          )}
        </div>
      )}
      
      {/* أزرار التنقل */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* الصفحة السابقة */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="h-9 px-3"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            السابق
          </Button>
          
          {/* الصفحة الأولى */}
          {showFirstPage && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="h-9 w-9"
              >
                1
              </Button>
              {showPreviousEllipsis && (
                <div className="flex items-center justify-center h-9 w-9">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              )}
            </>
          )}
          
          {/* أرقام الصفحات */}
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-9 w-9"
            >
              {page}
            </Button>
          ))}
          
          {/* الصفحة الأخيرة */}
          {showLastPage && (
            <>
              {showNextEllipsis && (
                <div className="flex items-center justify-center h-9 w-9">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              )}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="h-9 w-9"
              >
                {totalPages}
              </Button>
            </>
          )}
          
          {/* الصفحة التالية */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="h-9 px-3"
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

// مكون بسيط للـ pagination
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  className?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  className
}) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-4",
      className
    )}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
      >
        <ChevronRight className="w-4 h-4 ml-1" />
        السابق
      </Button>
      
      <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
        صفحة {currentPage} من {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        التالي
        <ChevronLeft className="w-4 h-4 mr-1" />
      </Button>
    </div>
  );
};

// مكون للتنقل السريع
interface QuickNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  const [inputPage, setInputPage] = React.useState('');
  
  const handleGoToPage = () => {
    const page = parseInt(inputPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setInputPage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      className
    )}>
      <span className="text-gray-600 dark:text-gray-400">الذهاب إلى صفحة:</span>
      <input
        type="number"
        min="1"
        max={totalPages}
        value={inputPage}
        onChange={(e) => setInputPage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={currentPage.toString()}
        className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
      />
      <Button
        size="sm"
        onClick={handleGoToPage}
        disabled={!inputPage || parseInt(inputPage) < 1 || parseInt(inputPage) > totalPages}
      >
        اذهب
      </Button>
    </div>
  );
};
