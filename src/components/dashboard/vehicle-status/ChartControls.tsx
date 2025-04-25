
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, PieChart, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Filter className="h-3.5 w-3.5 mr-1" />
            {selectedFilter === 'all' ? 'All Vehicles' : 
             selectedFilter === 'issues' ? 'Issues' : 
             selectedFilter === 'available' ? 'Available' : 
             'Rented'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onFilterChange('all')}>
            All Vehicles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('available')}>
            Available
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('rented')}>
            Rented
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('issues')}>
            Issues
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 h-8 rounded-l-md rounded-r-none ${chartType === 'pie' ? 'bg-slate-100' : ''}`}
          onClick={() => onChartTypeChange('pie')}
        >
          <PieChart className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-3 h-8 rounded-l-none rounded-r-md ${chartType === 'donut' ? 'bg-slate-100' : ''}`}
          onClick={() => onChartTypeChange('donut')}
        >
          <BarChart className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
