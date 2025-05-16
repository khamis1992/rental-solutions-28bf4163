
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgreementFilters } from './types';

export function useAgreementFilters(initialFilters = {}): {
  filters: AgreementFilters;
  setFilters: React.Dispatch<React.SetStateAction<AgreementFilters>>;
  updateSearchParams: (newFilters: AgreementFilters) => void;
  getInitialFilters: () => Record<string, string>;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Function to get initial filters from URL parameters
  const getInitialFilters = () => {
    const params: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  // Initialize filters with URL params first, then override with initialFilters
  const [filters, setFilters] = useState<AgreementFilters>({
    ...getInitialFilters(),
    ...initialFilters // This ensures initialFilters take precedence over URL params
  });

  // Function to update URL parameters based on filters
  const updateSearchParams = (newFilters: AgreementFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update the URL parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        searchParams.delete(key);
        // Also remove from current filters
        delete updatedFilters[key];
      } else {
        searchParams.set(key, String(value));
      }
    });
    
    setSearchParams(searchParams);
    setFilters(updatedFilters);
  };

  return {
    filters,
    setFilters,
    updateSearchParams,
    getInitialFilters
  };
}
