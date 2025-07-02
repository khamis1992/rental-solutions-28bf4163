
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
  onFilterChange: (value: string) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  selectedFilter,
  onFilterChange
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Select value={selectedFilter || 'all'} onValueChange={onFilterChange}>
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
    </div>
  );
};
