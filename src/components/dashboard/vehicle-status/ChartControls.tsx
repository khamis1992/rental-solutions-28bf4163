import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="جميع المركبات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع المركبات</SelectItem>
          <SelectItem value="available">متاحة</SelectItem>
          <SelectItem value="rented">مؤجرة</SelectItem>
          <SelectItem value="issues">مشاكل</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex gap-1">
        <Button 
          variant={chartType === 'pie' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8"
          onClick={() => onChartTypeChange('pie')}
        >
          دائري
        </Button>
        <Button 
          variant={chartType === 'donut' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8"
          onClick={() => onChartTypeChange('donut')}
        >
          حلقي
        </Button>
      </div>
    </div>
  );
};
