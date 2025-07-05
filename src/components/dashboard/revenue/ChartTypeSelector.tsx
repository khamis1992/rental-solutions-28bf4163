import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, AreaChart } from 'lucide-react';
import { ChartType } from './types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  chartType,
  onChartTypeChange
}) => {
  const { language } = useLanguage();

  const getTooltip = (type: ChartType) => {
    if (language === 'ar') {
      switch (type) {
        case 'area': return 'مخطط المنطقة';
        case 'bar': return 'مخطط الأعمدة';
        case 'line': return 'مخطط الخطوط';
        default: return '';
      }
    } else {
      switch (type) {
        case 'area': return 'Area Chart';
        case 'bar': return 'Bar Chart';
        case 'line': return 'Line Chart';
        default: return '';
      }
    }
  };

  return (
    <div className={`flex ${language === 'ar' ? 'space-x-reverse space-x-1' : 'space-x-1'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Button 
        variant={chartType === 'area' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('area')}
        className="h-8"
        title={getTooltip('area')}
      >
        <AreaChart className="h-4 w-4" />
      </Button>
      <Button 
        variant={chartType === 'bar' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('bar')}
        className="h-8"
        title={getTooltip('bar')}
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button 
        variant={chartType === 'line' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onChartTypeChange('line')}
        className="h-8"
        title={getTooltip('line')}
      >
        <LineChart className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChartTypeSelector;
