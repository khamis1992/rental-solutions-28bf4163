
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChartControlsProps {
  selectedFilter: string;
  chartType: 'pie' | 'donut';
  onFilterChange: (value: string) => void;
  onChartTypeChange: (type: 'pie' | 'donut') => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  selectedFilter,
  chartType,
  onFilterChange,
  onChartTypeChange
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="All Vehicles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vehicles</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="rented">Rented Out</SelectItem>
          <SelectItem value="issues">Issues</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex gap-1">
        <Button 
          variant={chartType === 'pie' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8"
          onClick={() => onChartTypeChange('pie')}
        >
          Pie
        </Button>
        <Button 
          variant={chartType === 'donut' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8"
          onClick={() => onChartTypeChange('donut')}
        >
          Donut
        </Button>
      </div>
    </div>
  );
};
