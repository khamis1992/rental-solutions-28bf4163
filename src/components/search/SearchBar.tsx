
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const { 
    searchQuery, 
    setSearchQuery, 
    currentMatchIndex, 
    totalMatches,
    nextMatch,
    previousMatch
  } = useSearch();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          id="table-search"
          type="search"
          placeholder="Search... (Ctrl+F)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-20"
        />
        {totalMatches > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currentMatchIndex + 1} of {totalMatches}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={previousMatch}
          disabled={totalMatches === 0}
          className="h-9 w-9"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon" 
          onClick={nextMatch}
          disabled={totalMatches === 0}
          className="h-9 w-9"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
