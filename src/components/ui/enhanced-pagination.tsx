import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  showInfo?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  maxPagesToShow?: number;
  loading?: boolean;
}

const formatArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-QA');
};

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
  showInfo = true,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
  maxPagesToShow = 7,
  loading = false
}) => {
  if (totalPages === 0) return null;

  // حساب الصفحات المرئية
  const getVisiblePages = () => {
    const delta = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    
    // تعديل البداية إذا كنا قريبين من النهاية
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    if (!loading) {
      onPageSizeChange(parseInt(newPageSize));
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* معلومات النتائج */}
      {showInfo && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span>
            عرض {formatArabicNumber(startItem)} إلى {formatArabicNumber(endItem)} من أصل {formatArabicNumber(totalItems)} نتيجة
          </span>
        </div>
      )}

      {/* أزرار التنقل */}
      <div className="flex items-center gap-2">
        {/* الانتقال إلى الصفحة الأولى */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 p-0"
          title="الصفحة الأولى"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {/* الصفحة السابقة */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 p-0"
          title="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {/* نقاط في البداية */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={loading}
                className="h-8 min-w-8 px-2"
              >
                {formatArabicNumber(1)}
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </>
          )}

          {/* الصفحات المرئية */}
          {visiblePages.map(page => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className={cn(
                "h-8 min-w-8 px-2",
                page === currentPage && "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {formatArabicNumber(page)}
            </Button>
          ))}

          {/* نقاط في النهاية */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={loading}
                className="h-8 min-w-8 px-2"
              >
                {formatArabicNumber(totalPages)}
              </Button>
            </>
          )}
        </div>

        {/* الصفحة التالية */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0"
          title="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* الانتقال إلى الصفحة الأخيرة */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0"
          title="الصفحة الأخيرة"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* اختيار حجم الصفحة */}
      {showPageSizeSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            عدد العناصر:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={loading}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {formatArabicNumber(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

// مكون pagination مبسط للاستخدام السريع
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  className
}) => {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="h-8 px-3"
      >
        السابق
      </Button>

      <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
        {formatArabicNumber(currentPage)} من {formatArabicNumber(totalPages)}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="h-8 px-3"
      >
        التالي
      </Button>
    </div>
  );
};

// مكون للانتقال السريع لصفحة محددة
interface QuickNavigationProps {
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  totalPages,
  onPageChange,
  loading = false,
  className
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue);
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
        انتقل إلى الصفحة:
      </span>
      <input
        type="number"
        min="1"
        max={totalPages}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="رقم الصفحة"
        disabled={loading}
        className="w-20 h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!inputValue || loading}
        className="h-8 px-3"
      >
        انتقل
      </Button>
    </form>
  );
};

export default EnhancedPagination; 