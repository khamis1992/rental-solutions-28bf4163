
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

  // Handle direct search query input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (!value) {
      // Clear search if input is empty
      setSearchParams({ query: undefined });
      setSearchQuery('');
    }
  };

  // Handle search submission
  const handleSearch = () => {
    setSearchQuery(inputValue);
    setSearchParams({ query: inputValue });
  };

  // Handle Enter key for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setSearchParams({ query: undefined });
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder="Search agreements..."
          className="pl-10 pr-10"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue && inputValue !== searchQuery) {
              handleSearch();
            }
          }}
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
