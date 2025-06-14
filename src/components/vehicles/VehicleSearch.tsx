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
    return "Search by license plate, VIN, make or model... (supports fuzzy matching)";
  };

  // Get search hint text
  const getSearchHint = () => {
    if (isLicensePlatePattern(inputValue)) {
      return "Enhanced license plate matching active - supports partial and fuzzy searches";
    }
    return "Supports fuzzy license plate matching, VIN lookup, and vehicle details search";
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder={getPlaceholder()}
          className="pl-10 pr-16"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Info tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-4 w-4 text-muted-foreground hover:text-foreground"
                  type="button"
                  aria-label="Search help"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Enhanced Search Features:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Fuzzy license plate matching</li>
                    <li>• Partial number/letter searches</li>
                    <li>• VIN number lookup</li>
                    <li>• Make and model search</li>
                    <li>• Year-based filtering</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: Search "123" to find plates ending in 123
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Clear button */}
          {inputValue && (
            <button
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Search hint */}
      {showHint && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 z-10">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>{getSearchHint()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
