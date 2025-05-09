
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface VehicleSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function VehicleSearch({
  searchQuery,
  setSearchQuery,
}: VehicleSearchProps) {
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

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder="Search by license plate, VIN, make or model..."
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
