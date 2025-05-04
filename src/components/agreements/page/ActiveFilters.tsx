
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActiveFiltersProps {
  activeFilters: [string, any][];
  setSearchParams: (params: Record<string, any>) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  activeFilters,
  setSearchParams
}) => {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {activeFilters.map(([key, value]) => (
        <Badge 
          key={key} 
          variant="outline" 
          className="flex gap-1 items-center px-3 py-1"
        >
          <span className="font-medium">{key}:</span> {value}
          <button 
            className="ml-1 rounded-full hover:bg-muted p-0.5"
            onClick={() => {
              setSearchParams(prev => {
                const newParams = { ...prev };
                delete newParams[key];
                return newParams;
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => {
          setSearchParams({ status: 'all' });
        }}
        className="text-xs h-7 px-2"
      >
        Clear All
      </Button>
    </div>
  );
};
