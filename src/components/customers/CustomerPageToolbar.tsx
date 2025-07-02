
import { CustomerListFilter } from '@/components/customers/CustomerListFilter';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* أزرار الإجراءات - تتكيف مع الوضع المحمول */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 order-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 flex-row-reverse flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onImportClick}
            disabled={!isEdgeFunctionAvailable}
            className="flex items-center gap-2 flex-row-reverse flex-1 sm:flex-none"
          >
            {!isEdgeFunctionAvailable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.import')} CSV</span>
            <span className="sm:hidden">استيراد</span>
          </Button>
        </div>
      </div>
      
      {/* فلتر البحث - عرض كامل على الوضع المحمول */}
      <div className="w-full">
        <CustomerListFilter 
          onSearch={(query) => setFilters({ ...filters, search: query })} 
          searchTerm={filters.search || ''}
          onFilterChange={(filter) => setFilters({ ...filters, ...filter })}
        />
      </div>
    </div>
  );
};
