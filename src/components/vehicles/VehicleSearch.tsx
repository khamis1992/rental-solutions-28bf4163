import React, { useState, useEffect } from 'react';
import { Search, X, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isLicensePlatePattern } from '@/utils/searchUtils';

interface VehicleSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function VehicleSearch({
  searchQuery,
  setSearchQuery,
}: VehicleSearchProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showHint, setShowHint] = useState(false);
  const debouncedValue = useDebounce(inputValue, 500);

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedValue !== searchQuery) {
      handleSearch(debouncedValue);
    }
  }, [debouncedValue]);

  // Show hint when user types what looks like a license plate
  useEffect(() => {
    setShowHint(inputValue.length >= 2 && isLicensePlatePattern(inputValue));
  }, [inputValue]);

  // Handle direct search query input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  // Handle search submission
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Handle Enter key for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(inputValue);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  // Get placeholder text based on search capabilities
  const getPlaceholder = () => {
    return "البحث برقم اللوحة، رقم الهيكل، الماركة أو الموديل... (يدعم البحث التقريبي)";
  };

  // Get search hint text
  const getSearchHint = () => {
    if (isLicensePlatePattern(inputValue)) {
      return "مطابقة محسنة لرقم اللوحة نشطة - يدعم البحث الجزئي والتقريبي";
    }
    return "يدعم مطابقة رقم اللوحة التقريبي، البحث برقم الهيكل، وتفاصيل المركبة";
  };

  return (
    <div className="relative w-full max-w-md" dir="rtl">
      <div className="relative flex items-center">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder={getPlaceholder()}
          className="pr-10 pl-16 text-right"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          dir="rtl"
        />
        
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear button */}
          {inputValue && (
            <button
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Info tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-4 w-4 text-muted-foreground hover:text-foreground"
                  type="button"
                  aria-label="مساعدة البحث"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs" dir="rtl">
                <div className="space-y-2 text-sm text-right">
                  <p className="font-medium">ميزات البحث المحسنة:</p>
                  <ul className="space-y-1 text-xs text-right">
                    <li>• مطابقة تقريبية لرقم اللوحة</li>
                    <li>• بحث بالأرقام أو الحروف الجزئية</li>
                    <li>• البحث برقم الهيكل</li>
                    <li>• البحث بالماركة والموديل</li>
                    <li>• التصفية حسب السنة</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    مثال: البحث بـ "123" للعثور على لوحات تنتهي بـ 123
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Search hint */}
      {showHint && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 z-10" dir="rtl">
          <div className="flex items-center gap-1 flex-row-reverse text-right">
            <span>{getSearchHint()}</span>
            <Info className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}
