import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface CustomerListFilterProps {
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
}

export const CustomerListFilterClone: React.FC<CustomerListFilterProps> = ({ searchTerm, onSearch, onFilterChange }) => {
  const [search, setSearch] = useState(searchTerm || '');
  
  useEffect(() => {
    setSearch(searchTerm || '');
  }, [searchTerm]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    onSearch(search);
  };
  
  const handleClearSearch = () => {
    setSearch('');
    onSearch('');
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="w-full">
        <Label htmlFor="search" className="sr-only">
          Search customers...
        </Label>
        <div className="relative">
          <Input
            type="search"
            id="search"
            placeholder="Search agreements..."
            value={search}
            onChange={handleSearchChange}
            className="pr-10"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            onClick={handleSearchSubmit}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
