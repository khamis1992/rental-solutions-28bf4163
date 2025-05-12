
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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

// Memoized dropdown items to prevent recreation on each render
const filterOptions = [
  "Created this month",
  "With active agreements",
  "Without documents",
];

interface CustomerListFilterProps {
  onSearch: (query: string) => void;
  searchTerm: string;
  onFilterChange?: (filters: { [key: string]: string }) => void;
}

export const CustomerListFilterClone: React.FC<CustomerListFilterProps> = memo(({
  onSearch,
  searchTerm,
  onFilterChange
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Only update search value when searchTerm prop changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  // Memoize handleSearchChange to prevent recreation on each render
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    onSearch('');
  }, [onSearch]);

  const resetFilters = useCallback(() => {
    if (onFilterChange) onFilterChange({});
  }, [onFilterChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, phone or ID..."
          className="pl-9 pr-8 h-10"
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.map((option, index) => (
            <DropdownMenuItem key={index}>{option}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <Button 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={resetFilters}
            >
              Reset all filters
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

// Add display name for better debugging
CustomerListFilterClone.displayName = 'CustomerListFilterClone';

// Export both names for backward compatibility
export default CustomerListFilterClone;
