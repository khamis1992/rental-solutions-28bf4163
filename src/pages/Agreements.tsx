
import React, { Suspense, useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { Button } from '@/components/ui/button';

const Agreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by customer name or vehicle license plate..."
            className="w-full pl-9 pr-9"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleSearchChange(e.target.value);
            }}
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading agreements...</span>
        </div>
      }>
        <AgreementList searchQuery={searchQuery} />
      </Suspense>
    </PageContainer>
  );
};

export default Agreements;
