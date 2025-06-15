import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerListFilter } from '@/components/customers/CustomerListFilter';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleAddCustomer = () => {
    navigate('/customers/add');
  };

  return (
    <div className="flex flex-col sm:flex-row-reverse justify-between gap-4" dir="rtl">
      <CustomerListFilter 
        onSearch={(query) => setFilters({ ...filters, search: query })} 
        searchTerm={filters.search || ''}
        onFilterChange={(filter) => setFilters({ ...filters, ...filter })}
      />
      
      <div className="flex flex-wrap gap-2 flex-row-reverse">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 flex-row-reverse"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onImportClick}
          disabled={!isEdgeFunctionAvailable}
          className="flex items-center gap-2 flex-row-reverse"
        >
          {!isEdgeFunctionAvailable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <Upload className="h-4 w-4" />
          {t('common.import')} CSV
        </Button>
        
        <Button 
          onClick={handleAddCustomer}
          size="sm"
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 flex-row-reverse"
        >
          <PlusCircle className="h-4 w-4" />
          {t('customer.add')}
        </Button>
      </div>
    </div>
  );
};
