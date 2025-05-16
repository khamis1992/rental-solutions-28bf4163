
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, Download, Upload, Plus } from 'lucide-react';
import { CustomerListFilterClone } from '@/components/agreements/CustomerListFilterClone';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchActionBarProps {
  searchQuery: string;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
  onImportClick: () => void;
  onAddAgreementClick: () => void;
}

export const SearchActionBar: React.FC<SearchActionBarProps> = ({
  searchQuery,
  showFilters,
  setShowFilters,
  onSearch,
  onFilterChange,
  onImportClick,
  onAddAgreementClick
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
      <CustomerListFilterClone
        searchTerm={searchQuery}
        onSearch={onSearch}
        onFilterChange={onFilterChange}
      />
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Advanced Filters"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onImportClick}>
              Import from CSV
            </DropdownMenuItem>
            <DropdownMenuItem>Download Template</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          size="sm"
          onClick={onAddAgreementClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </Button>
      </div>
    </div>
  );
};
