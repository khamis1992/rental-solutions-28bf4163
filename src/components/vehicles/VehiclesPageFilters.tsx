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
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex-1">
        <VehicleFilters 
          onFilterChange={onFilterChange} 
          initialValues={filterValues}
        />
      </div>
      
      {/* View Mode Toggle */}
      <div className="flex gap-1 border rounded-lg p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
        >
          <GridIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};