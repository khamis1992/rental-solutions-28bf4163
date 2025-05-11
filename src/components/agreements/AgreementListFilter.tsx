
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgreementListFilterProps {
  onSearch: (query: string) => void;
  searchTerm: string;
  onFilterChange?: (filters: Record<string, any>) => void;
}

export const AgreementListFilter: React.FC<AgreementListFilterProps> = ({
  onSearch,
  searchTerm,
  onFilterChange
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const debouncedSearchValue = useDebounce(searchValue, 300);
  
  // Effect to trigger search when debounced value changes
  React.useEffect(() => {
    onSearch(debouncedSearchValue);
  }, [debouncedSearchValue, onSearch]);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  
  // Clear search input
  const handleClearSearch = () => {
    setSearchValue('');
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search agreements by number, customer or vehicle..."
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
          <DropdownMenuItem onClick={() => onFilterChange && onFilterChange({ status: 'active' })}>Active Agreements</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange && onFilterChange({ status: 'pending' })}>Pending Agreements</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const next30Days = new Date();
            next30Days.setDate(next30Days.getDate() + 30);
            onFilterChange && onFilterChange({ 
              end_date_after: new Date().toISOString(),
              end_date_before: next30Days.toISOString()
            });
          }}>Expiring Soon</DropdownMenuItem>
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
