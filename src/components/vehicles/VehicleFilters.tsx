import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleStatus } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
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
    <div className={cn("rounded-lg", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="relative md:col-span-2">
          <div className={`absolute inset-y-0 flex items-center pl-3 pointer-events-none ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder={language === 'ar' ? 'البحث برقم الهيكل...' : 'Search by VIN...'}
            className={language === 'ar' ? 'pr-10 text-right' : 'pl-10'}
            value={filters?.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        <div>
          <Select 
            value={filters.status} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder={language === 'ar' ? 'جميع الحالات' : 'All Statuses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
              <SelectItem value="available">{language === 'ar' ? 'متاحة' : 'Available'}</SelectItem>
              <SelectItem value="rented">{language === 'ar' ? 'مؤجرة' : 'Rented'}</SelectItem>
              <SelectItem value="reserved">{language === 'ar' ? 'محجوزة' : 'Reserved'}</SelectItem>
              <SelectItem value="maintenance">{language === 'ar' ? 'قيد الصيانة' : 'Maintenance'}</SelectItem>
              <SelectItem value="police_station">{language === 'ar' ? 'في المركز' : 'Police Station'}</SelectItem>
              <SelectItem value="accident">{language === 'ar' ? 'حادث' : 'Accident'}</SelectItem>
              <SelectItem value="stolen">{language === 'ar' ? 'مسروقة' : 'Stolen'}</SelectItem>
              <SelectItem value="retired">{language === 'ar' ? 'متقاعدة' : 'Retired'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={filters.make} 
            onValueChange={(value) => handleFilterChange('make', value)}
          >
            <SelectTrigger id="make-filter">
              <SelectValue placeholder={language === 'ar' ? 'جميع الماركات' : 'All Makes'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الماركات' : 'All Makes'}</SelectItem>
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
          >
            <SelectTrigger id="location-filter">
              <SelectValue placeholder={language === 'ar' ? 'جميع المواقع' : 'All Locations'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع المواقع' : 'All Locations'}</SelectItem>
              <SelectItem value="Main Garage">{language === 'ar' ? 'المرآب الرئيسي' : 'Main Garage'}</SelectItem>
              <SelectItem value="Downtown">{language === 'ar' ? 'وسط المدينة' : 'Downtown'}</SelectItem>
              <SelectItem value="Airport">{language === 'ar' ? 'المطار' : 'Airport'}</SelectItem>
              <SelectItem value="North Branch">{language === 'ar' ? 'الفرع الشمالي' : 'North Branch'}</SelectItem>
              <SelectItem value="South Branch">{language === 'ar' ? 'الفرع الجنوبي' : 'South Branch'}</SelectItem>
              <SelectItem value="East Branch">{language === 'ar' ? 'الفرع الشرقي' : 'East Branch'}</SelectItem>
              <SelectItem value="West Branch">{language === 'ar' ? 'الفرع الغربي' : 'West Branch'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={filters.year} 
            onValueChange={(value) => handleFilterChange('year', value)}
          >
            <SelectTrigger id="year-filter">
              <SelectValue placeholder={language === 'ar' ? 'جميع السنوات' : 'All Years'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع السنوات' : 'All Years'}</SelectItem>
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
