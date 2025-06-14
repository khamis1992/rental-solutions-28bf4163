
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, AreaChart } from 'lucide-react';
import { ChartType } from './types';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  chartType,
  onChartTypeChange
}) => {
  return (
    <div className="flex space-x-1">
      <Button 
        variant={chartType === 'area' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('area')}
        className="h-8"
      >
        <AreaChart className="h-4 w-4" />
      </Button>
      <Button 
        variant={chartType === 'bar' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('bar')}
        className="h-8"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button 
        variant={chartType === 'line' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('line')}
        className="h-8"
      >
        <LineChart className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChartTypeSelector;
