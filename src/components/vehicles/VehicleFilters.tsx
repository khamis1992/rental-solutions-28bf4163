import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { VehicleStatus } from '@/types/vehicle';

import { useLanguage } from '@/contexts/LanguageContext';

export interface VehicleFilterValues {
  status: string;
  make: string;
  location: string;
  year: string;
  category: string;
  search?: string;
}

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  initialValues?: VehicleFilterValues;
  className?: string;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  onFilterChange,
  initialValues = {
    status: 'all',
    make: 'all',
    location: 'all',
    year: 'all',
    category: 'all',
    search: ''
  },
  className
}) => {
  const { language } = useLanguage();
  const [filters, setFilters] = useState<VehicleFilterValues>(initialValues);
  
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  const handleFilterChange = (key: keyof VehicleFilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };
  
  return (
    <div className={cn("rounded-lg", className)} dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 flex items-center right-0 pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="البحث برقم الهيكل..."
            className="pr-10 text-right"
            value={filters?.search || ''}
            onChange={handleSearchChange}
            dir="rtl"
          />
        </div>
        
        <div>
          <Select 
            value={filters.status} 
            onValueChange={(value) => handleFilterChange('status', value)}
            dir="rtl"
          >
            <SelectTrigger id="status-filter" className="text-right">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="available">متاحة</SelectItem>
              <SelectItem value="rented">مؤجرة</SelectItem>
              <SelectItem value="reserved">محجوزة</SelectItem>
              <SelectItem value="maintenance">قيد الصيانة</SelectItem>
              <SelectItem value="police_station">في المركز</SelectItem>
              <SelectItem value="accident">حادث</SelectItem>
              <SelectItem value="stolen">مسروقة</SelectItem>
              <SelectItem value="retired">متقاعدة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={filters.make} 
            onValueChange={(value) => handleFilterChange('make', value)}
            dir="rtl"
          >
            <SelectTrigger id="make-filter" className="text-right">
              <SelectValue placeholder="جميع الماركات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الماركات</SelectItem>
              <SelectItem value="Toyota">تويوتا</SelectItem>
              <SelectItem value="Honda">هوندا</SelectItem>
              <SelectItem value="Nissan">نيسان</SelectItem>
              <SelectItem value="Ford">فورد</SelectItem>
              <SelectItem value="Hyundai">هيونداي</SelectItem>
              <SelectItem value="Kia">كيا</SelectItem>
              <SelectItem value="Mazda">مازدا</SelectItem>
              <SelectItem value="Mercedes">مرسيدس</SelectItem>
              <SelectItem value="BMW">بي إم دبليو</SelectItem>
              <SelectItem value="Audi">أودي</SelectItem>
              <SelectItem value="Lexus">لكزس</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={filters.location} 
            onValueChange={(value) => handleFilterChange('location', value)}
            dir="rtl"
          >
            <SelectTrigger id="location-filter" className="text-right">
              <SelectValue placeholder="جميع المواقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواقع</SelectItem>
              <SelectItem value="Main Garage">المرآب الرئيسي</SelectItem>
              <SelectItem value="Downtown">وسط المدينة</SelectItem>
              <SelectItem value="Airport">المطار</SelectItem>
              <SelectItem value="North Branch">الفرع الشمالي</SelectItem>
              <SelectItem value="South Branch">الفرع الجنوبي</SelectItem>
              <SelectItem value="East Branch">الفرع الشرقي</SelectItem>
              <SelectItem value="West Branch">الفرع الغربي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={filters.year} 
            onValueChange={(value) => handleFilterChange('year', value)}
            dir="rtl"
          >
            <SelectTrigger id="year-filter" className="text-right">
              <SelectValue placeholder="جميع السنوات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع السنوات</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2019">2019</SelectItem>
              <SelectItem value="2018">2018</SelectItem>
              <SelectItem value="2017">2017</SelectItem>
              <SelectItem value="2016">2016</SelectItem>
              <SelectItem value="2015">2015</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default VehicleFilters;
