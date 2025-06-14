import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceFiltersProps {
  onFilterChange: (filters: MaintenanceFilterOptions) => void;
  vehicleOptions: Array<{ id: string; label: string }>;
}

export interface MaintenanceFilterOptions {
  searchTerm: string;
  status: string;
  vehicle: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  maintenanceType: string;
}

const MaintenanceFilters = ({ onFilterChange, vehicleOptions }: MaintenanceFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<MaintenanceFilterOptions>({
    searchTerm: '',
    status: '',
    vehicle: '',
    dateFrom: undefined,
    dateTo: undefined,
    maintenanceType: ''
  });

  const { language } = useLanguage();

  const handleInputChange = (key: keyof MaintenanceFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      searchTerm: '',
      status: '',
      vehicle: '',
      dateFrom: undefined,
      dateTo: undefined,
      maintenanceType: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const maintenanceTypes = [
    { value: 'oil_change', label: language === 'ar' ? 'تغيير الزيت' : 'Oil Change' },
    { value: 'tire_replacement', label: language === 'ar' ? 'استبدال الإطارات' : 'Tire Replacement' },
    { value: 'brake_service', label: language === 'ar' ? 'خدمة الفرامل' : 'Brake Service' },
    { value: 'regular_inspection', label: language === 'ar' ? 'فحص دوري' : 'Regular Inspection' },
    { value: 'engine_repair', label: language === 'ar' ? 'إصلاح المحرك' : 'Engine Repair' },
    { value: 'air_conditioning', label: language === 'ar' ? 'تكييف الهواء' : 'Air Conditioning' },
    { value: 'transmission', label: language === 'ar' ? 'ناقل الحركة' : 'Transmission' },
    { value: 'battery_replacement', label: language === 'ar' ? 'استبدال البطارية' : 'Battery Replacement' },
    { value: 'electrical_repair', label: language === 'ar' ? 'إصلاح كهربائي' : 'Electrical Repair' }
  ];

  const statusOptions = [
    { value: 'all', label: language === 'ar' ? 'جميع الحالات' : 'All Statuses' },
    { value: 'scheduled', label: language === 'ar' ? 'مجدولة' : 'Scheduled' },
    { value: 'in_progress', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
    { value: 'completed', label: language === 'ar' ? 'مكتملة' : 'Completed' },
    { value: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Cancelled' }
  ];

  return (
    <div className="mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-2 mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="relative flex-1">
          <Input
            placeholder={language === 'ar' ? 'البحث في سجلات الصيانة...' : 'Search maintenance records...'}
            value={filters?.searchTerm || ''}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className={`${language === 'ar' ? 'pr-10 text-right' : 'pl-10'}`}
          />
          <Search className={`absolute top-2.5 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={isExpanded ? "bg-muted" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {Object.values(filters).some(Boolean) && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <Card className="p-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`text-sm font-medium mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  handleInputChange('status', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by status'} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className={`text-sm font-medium mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'المركبة' : 'Vehicle'}
              </label>
              <Select
                value={filters.vehicle}
                onValueChange={(value) =>
                  handleInputChange('vehicle', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={language === 'ar' ? 'اختيار المركبة' : 'Select vehicle'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع المركبات' : 'All Vehicles'}</SelectItem>
                  {vehicleOptions.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className={`text-sm font-medium mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}
              </label>
              <Select
                value={filters.maintenanceType}
                onValueChange={(value) =>
                  handleInputChange('maintenanceType', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={language === 'ar' ? 'اختيار النوع' : 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={`text-sm font-medium mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'من تاريخ' : 'From Date'}
              </label>
              <DatePicker
                date={filters.dateFrom ? (filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)) : undefined}
                setDate={(date) => handleInputChange('dateFrom', date)}
                placeholder={language === 'ar' ? 'من تاريخ' : 'From date'}
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
              </label>
              <DatePicker
                date={filters.dateTo ? (filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)) : undefined}
                setDate={(date) => handleInputChange('dateTo', date)}
                placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceFilters;
