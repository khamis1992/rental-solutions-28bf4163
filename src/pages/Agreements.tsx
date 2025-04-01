
import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const Agreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const clearSearch = () => {
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
            onChange={(e) => handleSearchChange(e.target.value)}
            value={searchQuery}
          />
          {searchQuery && (
            <button 
              className="absolute right-2.5 top-2.5"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
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
