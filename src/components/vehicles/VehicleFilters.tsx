
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation as useI18nTranslation } from 'react-i18next';

export interface VehicleFilterValues {
  status: string;
  make: string;
  location: string;
  year: string;
  category: string;
}

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  initialValues: VehicleFilterValues;
  className?: string;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({ 
  onFilterChange, 
  initialValues,
  className = ''
}) => {
  const { t } = useI18nTranslation();
  
  const [filters, setFilters] = React.useState<VehicleFilterValues>(initialValues);

  const handleFilterChange = (key: keyof VehicleFilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 ${className}`}>
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('vehicles.filterBy.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('vehicles.allStatuses')}</SelectItem>
          <SelectItem value="available">{t('vehicles.status.available')}</SelectItem>
          <SelectItem value="rented">{t('vehicles.status.rented')}</SelectItem>
          <SelectItem value="maintenance">{t('vehicles.status.maintenance')}</SelectItem>
          <SelectItem value="reserved">{t('vehicles.status.reserved')}</SelectItem>
          <SelectItem value="police_station">{t('vehicles.status.police_station')}</SelectItem>
          <SelectItem value="accident">{t('vehicles.status.accident')}</SelectItem>
          <SelectItem value="stolen">{t('vehicles.status.stolen')}</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.make}
        onValueChange={(value) => handleFilterChange('make', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('vehicles.filterBy.make')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('vehicles.allMakes')}</SelectItem>
          <SelectItem value="Toyota">Toyota</SelectItem>
          <SelectItem value="Honda">Honda</SelectItem>
          <SelectItem value="Ford">Ford</SelectItem>
          <SelectItem value="BMW">BMW</SelectItem>
          <SelectItem value="Mercedes">Mercedes</SelectItem>
          <SelectItem value="Audi">Audi</SelectItem>
          <SelectItem value="Hyundai">Hyundai</SelectItem>
          <SelectItem value="Nissan">Nissan</SelectItem>
          <SelectItem value="Kia">Kia</SelectItem>
          <SelectItem value="BYD">BYD</SelectItem>
          <SelectItem value="Chery">Chery</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.location}
        onValueChange={(value) => handleFilterChange('location', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('vehicles.filterBy.location')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('vehicles.allLocations')}</SelectItem>
          <SelectItem value="Main Office">Main Office</SelectItem>
          <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
          <SelectItem value="Airport Location">Airport Location</SelectItem>
          <SelectItem value="East Side">East Side</SelectItem>
          <SelectItem value="West Side">West Side</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.year}
        onValueChange={(value) => handleFilterChange('year', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('vehicles.filterBy.year')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('vehicles.allYears')}</SelectItem>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
          <SelectItem value="2022">2022</SelectItem>
          <SelectItem value="2021">2021</SelectItem>
          <SelectItem value="2020">2020</SelectItem>
          <SelectItem value="2019">2019</SelectItem>
          <SelectItem value="2018">2018</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.category}
        onValueChange={(value) => handleFilterChange('category', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('vehicles.filterBy.category')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('vehicles.allCategories')}</SelectItem>
          <SelectItem value="1">Sedan</SelectItem>
          <SelectItem value="2">SUV</SelectItem>
          <SelectItem value="3">Truck</SelectItem>
          <SelectItem value="4">Van</SelectItem>
          <SelectItem value="5">Luxury</SelectItem>
          <SelectItem value="6">Electric</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default VehicleFilters;
