
import React from 'react';
import { Filter, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgreementSearch } from '@/components/agreements/page/AgreementSearch';
import { CustomerInfo } from '@/types/customer';
import { ImportDropdownMenu } from '@/components/agreements/page/ImportDropdownMenu';

interface AgreementFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo | null) => void;
  setSearchParams: (params: Record<string, any>) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;
  onAddAgreement: () => void;
}

export function AgreementFiltersBar({
  searchQuery,
  setSearchQuery,
  selectedCustomer,
  setSelectedCustomer,
  setSearchParams,
  showFilters,
  setShowFilters,
  setIsImportModalOpen,
  onAddAgreement
}: AgreementFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
      <div className="flex-1 max-w-md">
        <AgreementSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          setSearchParams={setSearchParams}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Filters"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <ImportDropdownMenu 
          setIsImportModalOpen={setIsImportModalOpen} 
        />
        
        <Button size="sm" onClick={onAddAgreement}>
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </Button>
      </div>
    </div>
  );
}
