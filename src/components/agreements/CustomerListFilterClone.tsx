
import React, { useState, useEffect, useCallback, memo } from 'react';
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

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

  // Only update search value when searchTerm prop changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  // Use the debounced callback hook
  const handleDebouncedSearch = useDebouncedCallback((value: string) => {
    onSearch(value);
  }, 300);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      handleDebouncedSearch(value);
    },
    [handleDebouncedSearch]
  );

  // Clear search input
  const handleClear = useCallback(() => {
    setSearchValue("");
    onSearch("");
  }, [onSearch]);

  // Apply filter
  const handleFilterClick = useCallback(
    (filter: string) => {
      if (onFilterChange) {
        onFilterChange({ type: filter });
      }
    },
    [onFilterChange]
  );

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />        <Input
          type="search"
          placeholder="Search by customer name or license plate..."
          className="pl-8 w-full"
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 rounded-full"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filterOptions.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleFilterClick(option)}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

CustomerListFilterClone.displayName = 'CustomerListFilterClone';
