import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerListFilter } from '@/components/customers/CustomerListFilter';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, RefreshCw, AlertTriangle } from 'lucide-react';

interface CustomerPageToolbarProps {
  filters: {
    search?: string;
  };
  setFilters: (filters: any) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onImportClick: () => void;
  isEdgeFunctionAvailable: boolean;
}

export const CustomerPageToolbar: React.FC<CustomerPageToolbarProps> = ({
  filters,
  setFilters,
  onRefresh,
  isRefreshing,
  onImportClick,
  isEdgeFunctionAvailable,
}) => {
  const navigate = useNavigate();

  const handleAddCustomer = () => {
    navigate('/customers/add');
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <CustomerListFilter 
        onSearch={(query) => setFilters({ ...filters, search: query })} 
        searchTerm={filters.search || ''}
      />
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onImportClick}
          disabled={!isEdgeFunctionAvailable}
          className="flex items-center gap-1"
        >
          {!isEdgeFunctionAvailable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        
        <Button 
          onClick={handleAddCustomer}
          size="sm"
          className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Add Customer
        </Button>
      </div>
    </div>
  );
};
