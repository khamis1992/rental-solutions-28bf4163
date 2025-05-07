
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook for managing agreement filters and search parameters
 */
export function useAgreementFilters(initialFilters = {}) {
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
  // This ensures direct initialFilters (like customer_id) take precedence
  const [filters, setFilters] = useState({
    ...getInitialFilters(),
    ...initialFilters // This ensures initialFilters (like customer_id) take precedence over URL params
  });

  // Function to update URL parameters based on filters
  const updateSearchParams = (newFilters: { [key: string]: string | undefined }) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update the URL parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        searchParams.delete(key);
        // Also remove from current filters
        delete updatedFilters[key];
      } else {
        searchParams.set(key, value);
      }
    });
    setSearchParams(searchParams);
    setFilters(updatedFilters);
  };

  return {
    filters,
    setFilters,
    searchParams,
    setSearchParams: updateSearchParams
  };
}
