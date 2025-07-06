import { Button } from '@/components/ui/button';
import { GridIcon, List } from 'lucide-react';
import VehicleFilters, { VehicleFilterValues } from './VehicleFilters';

type ViewMode = 'grid' | 'list';

interface VehiclesPageFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  filterValues: VehicleFilterValues;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const VehiclesPageFilters = ({ 
  onFilterChange, 
  filterValues, 
  viewMode, 
  onViewModeChange 
}: VehiclesPageFiltersProps) => {
  return (
    <div className="bg-card rounded-xl p-6 border shadow-sm" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <VehicleFilters 
            onFilterChange={onFilterChange} 
            initialValues={filterValues}
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-9 px-4"
          >
            <GridIcon className="h-4 w-4 ml-2" />
            شبكة
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-9 px-4"
          >
            <List className="h-4 w-4 ml-2" />
            قائمة
          </Button>
        </div>
      </div>
    </div>
  );
};