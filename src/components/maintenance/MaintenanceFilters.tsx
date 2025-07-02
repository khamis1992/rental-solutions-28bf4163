// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

import { DatePicker } from '@/components/ui/date-picker';

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
    { value: 'oil_change', label: 'تغيير الزيت' },
    { value: 'tire_replacement', label: 'استبدال الإطارات' },
    { value: 'brake_service', label: 'خدمة الفرامل' },
    { value: 'regular_inspection', label: 'فحص دوري' },
    { value: 'engine_repair', label: 'إصلاح المحرك' },
    { value: 'air_conditioning', label: 'تكييف الهواء' },
    { value: 'transmission', label: 'ناقل الحركة' },
    { value: 'battery_replacement', label: 'استبدال البطارية' },
    { value: 'electrical_repair', label: 'إصلاح كهربائي' }
  ];

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'scheduled', label: 'مجدولة' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'cancelled', label: 'ملغاة' }
  ];

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2 flex-row-reverse">
        <div className="relative flex-1">
          <Input
            placeholder="البحث في سجلات الصيانة..."
            value={filters?.searchTerm || ''}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className="pr-10 text-right"
            dir="rtl"
          />
          <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground right-3" />
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
        <Card className="p-4 mt-2" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-right">
                الحالة
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  handleInputChange('status', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir="rtl" className="text-right">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value} className="text-right">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block text-right">
                المركبة
              </label>
              <Select
                value={filters.vehicle}
                onValueChange={(value) =>
                  handleInputChange('vehicle', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir="rtl" className="text-right">
                  <SelectValue placeholder="اختيار المركبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-right">جميع المركبات</SelectItem>
                  {vehicleOptions.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id} className="text-right">
                      {vehicle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block text-right">
                نوع الصيانة
              </label>
              <Select
                value={filters.maintenanceType}
                onValueChange={(value) =>
                  handleInputChange('maintenanceType', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger dir="rtl" className="text-right">
                  <SelectValue placeholder="اختيار النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-right">جميع الأنواع</SelectItem>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-right">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-right">
                من تاريخ
              </label>
              <DatePicker
                date={filters.dateFrom ? (filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)) : undefined}
                setDate={(date) => handleInputChange('dateFrom', date)}
                placeholder="من تاريخ"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-right">
                إلى تاريخ
              </label>
              <DatePicker
                date={filters.dateTo ? (filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)) : undefined}
                setDate={(date) => handleInputChange('dateTo', date)}
                placeholder="إلى تاريخ"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceFilters;
