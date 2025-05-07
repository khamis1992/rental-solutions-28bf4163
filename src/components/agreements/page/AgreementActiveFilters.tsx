
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgreementActiveFiltersProps {
  activeFilters: [string, string][];
  setSearchParams: (params: Record<string, any>) => void;
}

export function AgreementActiveFilters({ 
  activeFilters, 
  setSearchParams 
}: AgreementActiveFiltersProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {activeFilters.map(([key, value]) => (
        <Badge 
          key={key} 
          variant="secondary"
          className="flex items-center gap-1"
        >
          {key}: {value}
          <button
            onClick={() => setSearchParams({ [key]: undefined })}
            className="ml-1 rounded-full hover:bg-accent p-1"
          >
            <span className="sr-only">Remove</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => {
          const cleanParams = {};
          activeFilters.forEach(([key]) => {
            cleanParams[key] = undefined;
          });
          setSearchParams(cleanParams);
        }}
      >
        Clear all
      </Button>
    </div>
  );
}
