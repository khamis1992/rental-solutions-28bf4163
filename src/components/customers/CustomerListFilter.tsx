import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerListFilterProps {
  onSearch: (query: string) => void;
  searchTerm: string;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export const CustomerListFilter: React.FC<CustomerListFilterProps> = ({
  onSearch,
  searchTerm,
  onFilterChange
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const filterOptions = [
    { label: "تم الإنشاء هذا الشهر", value: { createdThisMonth: 'true', hasActiveAgreement: '', missingDocuments: '', sort: '' } },
    { label: "بعقود نشطة", value: { createdThisMonth: '', hasActiveAgreement: 'true', missingDocuments: '', sort: '' } },
    { label: "بدون مستندات", value: { createdThisMonth: '', hasActiveAgreement: '', missingDocuments: 'true', sort: '' } },
    { label: "ترتيب من الأحدث إلى الأقدم", value: { createdThisMonth: '', hasActiveAgreement: '', missingDocuments: '', sort: 'desc' } },
  ];

  // Sync search input with external search term
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  // Debounced search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (timeoutId.current) clearTimeout(timeoutId.current);

    timeoutId.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    onSearch('');
  }, [onSearch]);

  const resetFilters = useCallback(() => {
    if (onFilterChange) onFilterChange({});
  }, [onFilterChange]);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto max-w-md flex-row-reverse">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ابحث بالاسم أو البريد أو الجوال أو الرقم..."
          className="pr-9 pl-8 h-10 text-right"
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            aria-label="مسح البحث"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">تصفية</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 text-right">
          <DropdownMenuLabel>خيارات التصفية</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.map((option, index) => (
            <DropdownMenuItem key={index} onClick={() => onFilterChange && onFilterChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <Button 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={resetFilters}
            >
              إعادة تعيين جميع الفلاتر
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CustomerListFilter;