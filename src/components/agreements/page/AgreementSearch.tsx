
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

interface AgreementSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSearchParams: (params: Record<string, any>) => void;
}

export function AgreementSearch({
  searchQuery,
  setSearchQuery,
  setSearchParams,
}: AgreementSearchProps) {
  const [searchValue, setSearchValue] = useState(searchQuery);
  
  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Add debounce for search
    const timeoutId = setTimeout(() => {
      if (!value || value.trim() === '') {
        // Clear search if input is empty
        setSearchParams({ query: undefined });
        setSearchQuery('');
      } else {
        // Set search parameters and reset to page 1
        setSearchParams({ 
          query: value,
          page: 1  // Important: Reset to page 1 when searching
        });
        setSearchQuery(value);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Clear search input
  const handleClearSearch = () => {
    setSearchValue('');
    setSearchQuery('');
    setSearchParams({ query: undefined, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (filter: Record<string, any>) => {
    setSearchParams({ ...filter, page: 1 });
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search agreements by number, plate or customer..."
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
          <DropdownMenuItem onClick={() => handleFilterChange({ status: 'active' })}>Active Agreements</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange({ status: 'pending' })}>Pending Agreements</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const next30Days = new Date();
            next30Days.setDate(next30Days.getDate() + 30);
            handleFilterChange({ 
              end_date_after: new Date().toISOString(),
              end_date_before: next30Days.toISOString()
            });
          }}>Expiring Soon</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <Button 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={() => handleFilterChange({})}
            >
              Reset all filters
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
