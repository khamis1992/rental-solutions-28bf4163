
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/useDebounce';

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
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedValue = useDebounce(inputValue, 500);

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedValue !== searchQuery) {
      handleSearch(debouncedValue);
    }
  }, [debouncedValue]);

  // Handle direct search query input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  // Handle search submission
  const handleSearch = (value: string) => {
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
    setSearchParams({ query: undefined, page: 1 });
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder="Search agreements by number, plate, or customer..."
          className="pl-10 pr-10"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        
        {inputValue && (
          <button
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClearSearch}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
