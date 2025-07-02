import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface AgreementListFilterProps {
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
}

export const AgreementListFilter = ({ searchTerm, onSearch }: AgreementListFilterProps) => {
  const [search, setSearch] = useState(searchTerm || '');
  
  useEffect(() => {
    setSearch(searchTerm || '');
  }, [searchTerm]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="relative w-full md:w-80">
        <Input
          type="text"
          placeholder="Search agreements..."
          value={search}
          onChange={handleSearchChange}
          className="pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearchSubmit}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
