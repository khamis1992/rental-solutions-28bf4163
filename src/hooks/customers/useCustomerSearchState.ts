
import { useState } from 'react';

interface SearchParams {
  query: string;
  status: string;
}

export const useCustomerSearchState = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    status: 'all',
  });

  return {
    searchParams,
    setSearchParams,
  };
};
