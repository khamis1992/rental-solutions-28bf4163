import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PaymentFilters } from '@/types/car-installment';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentFiltersBarProps {
  filters: PaymentFilters;
  onFilterChange: (filters: PaymentFilters) => void;
}

export const PaymentFiltersBar: React.FC<PaymentFiltersBarProps> = ({ 
  filters, 
  onFilterChange 
}) => {
  const { language } = useLanguage();

  const handleStatusChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      status: value === 'all' ? 'all' : value as any 
    });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFilterChange({ 
      ...filters, 
      [field]: value 
    });
  };

  return (
    <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Select 
        value={filters.status || 'all'} 
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className={`w-36 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'جميع الحالات' : 'All Status'}
          </SelectItem>
          <SelectItem value="pending" className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'معلق' : 'Pending'}
          </SelectItem>
          <SelectItem value="paid" className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'مدفوع' : 'Paid'}
          </SelectItem>
          <SelectItem value="overdue" className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'متأخر' : 'Overdue'}
          </SelectItem>
          <SelectItem value="cancelled" className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'ملغي' : 'Cancelled'}
          </SelectItem>
        </SelectContent>
      </Select>

      <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <Input
            type="date"
            placeholder={language === 'ar' ? 'من' : 'From'}
            value={filters.dateFrom || ''}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className={`w-36 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          />
        </div>
        <div>
          <Input
            type="date"
            placeholder={language === 'ar' ? 'إلى' : 'To'}
            value={filters.dateTo || ''}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className={`w-36 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          />
        </div>
      </div>
    </div>
  );
};
