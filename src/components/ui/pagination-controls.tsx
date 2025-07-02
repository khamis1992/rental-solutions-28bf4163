import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useLanguage } from '@/contexts/LanguageContext';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (count: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = "",
}: PaginationControlsProps) {
  const { language } = useLanguage();
  const startItem = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);
  
  return (
    <div className={`flex flex-col gap-4 py-4 ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Pagination centered */}
      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
      
      {/* Rows per page dropdown centered below pagination */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex justify-center">
          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'صفوف لكل صفحة' : 'Rows per page'}
            </p>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* Items info at the bottom */}
      <div className="flex justify-center">
        <div className={`text-sm text-muted-foreground ${language === 'ar' ? 'text-center' : 'text-center'}`}>
          {language === 'ar' ? (
            <>
              عرض <span className="font-medium">{startItem}</span> إلى{" "}
              <span className="font-medium">{endItem}</span> من{" "}
              <span className="font-medium">{totalItems}</span> عنصر
            </>
          ) : (
            <>
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> items
            </>
          )}
        </div>
      </div>
    </div>
  );
}
