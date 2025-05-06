
import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActiveFiltersProps {
  activeFilters: [string, string][];
  setSearchParams: (params: Record<string, any>) => void;
}

export function ActiveFilters({ activeFilters, setSearchParams }: ActiveFiltersProps) {
  if (!activeFilters.length) return null;

  const handleRemoveFilter = (key: string) => {
    setSearchParams({ [key]: undefined });
  };

  const handleClearAllFilters = () => {
    const clearedParams: Record<string, undefined> = {};
    activeFilters.forEach(([key]) => {
      clearedParams[key] = undefined;
    });
    setSearchParams(clearedParams);
  };

  const getLabelForFilter = (key: string, value: string): string => {
    switch (key) {
      case 'agreement_number':
        return `Agreement #: ${value}`;
      case 'status':
        return `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'start_date_after':
        return `Start Date After: ${new Date(value).toLocaleDateString()}`;
      case 'start_date_before':
        return `Start Date Before: ${new Date(value).toLocaleDateString()}`;
      case 'end_date_after':
        return `End Date After: ${new Date(value).toLocaleDateString()}`;
      case 'end_date_before':
        return `End Date Before: ${new Date(value).toLocaleDateString()}`;
      case 'rent_min':
        return `Min Rent: $${value}`;
      case 'rent_max':
        return `Max Rent: $${value}`;
      case 'query':
        return `Search: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mt-1">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="outline" className="flex items-center gap-1 py-1">
          {getLabelForFilter(key, value)}
          <button
            onClick={() => handleRemoveFilter(key)}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
            aria-label={`Remove ${key} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={handleClearAllFilters}
          className="text-xs text-muted-foreground hover:text-destructive underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
