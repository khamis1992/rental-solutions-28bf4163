
import React, { useState } from 'react';
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
  onFilterChange?: (filters: Record<string, any>) => void;
}

export const CustomerListFilter: React.FC<CustomerListFilterProps> = ({
  onSearch,
  searchTerm,
  onFilterChange
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  
  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Add debounce for search
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Clear search input
  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
  };

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
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
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
          <DropdownMenuItem>Created this month</DropdownMenuItem>
          <DropdownMenuItem>With active agreements</DropdownMenuItem>
          <DropdownMenuItem>Without documents</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <Button 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={() => onFilterChange && onFilterChange({})}
            >
              Reset all filters
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
