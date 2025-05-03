import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Search, FilterX, Filter, ChevronDown, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleStatus } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useMediaQuery } from '@/hooks/use-media-query';

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

// Define filter options inside the component to avoid incorrect hook usage
const VehicleFilters: React.FC<VehicleFiltersProps> = memo(({
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
  const [filters, setFilters] = useState<VehicleFilterValues>(initialValues);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Generate year options dynamically inside the component
  const YEAR_OPTIONS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: 'all', label: 'All Years' }];
  
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
  
    return years;
  }, []);

  // Define filter options within the component to avoid hooks outside component error
  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'rented', label: 'Rented' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'police_station', label: 'Police Station' },
    { value: 'accident', label: 'Accident' },
    { value: 'stolen', label: 'Stolen' },
    { value: 'retired', label: 'Retired' }
  ], []);

  const MAKE_OPTIONS = useMemo(() => [
    { value: 'all', label: 'All Makes' },
    { value: 'Toyota', label: 'Toyota' },
    { value: 'Honda', label: 'Honda' },
    { value: 'Nissan', label: 'Nissan' },
    { value: 'Ford', label: 'Ford' },
    { value: 'Hyundai', label: 'Hyundai' },
    { value: 'Kia', label: 'Kia' },
    { value: 'Mazda', label: 'Mazda' },
    { value: 'Mercedes', label: 'Mercedes' },
    { value: 'BMW', label: 'BMW' },
    { value: 'Audi', label: 'Audi' },
    { value: 'Lexus', label: 'Lexus' }
  ], []);

  const LOCATION_OPTIONS = useMemo(() => [
    { value: 'all', label: 'All Locations' },
    { value: 'Main Garage', label: 'Main Garage' },
    { value: 'Downtown', label: 'Downtown' },
    { value: 'Airport', label: 'Airport' },
    { value: 'North Branch', label: 'North Branch' },
    { value: 'South Branch', label: 'South Branch' },
    { value: 'East Branch', label: 'East Branch' },
    { value: 'West Branch', label: 'West Branch' }
  ], []);

  // Count active filters (excluding 'all' values and empty search)
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'search') {
        return value ? count + 1 : count;
      }
      return value !== 'all' ? count + 1 : count;
    }, 0);
  }, [filters]);

  // Debounced filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleFilterChange = useCallback((key: keyof VehicleFilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      make: 'all',
      location: 'all',
      year: 'all',
      category: 'all',
      search: ''
    });
    setIsPopoverOpen(false);
  }, []);

  // Render filter select component
  const renderFilterSelect = useCallback((
    id: string,
    label: string,
    value: string,
    options: { value: string; label: string }[],
    filterKey: keyof VehicleFilterValues
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(value) => handleFilterChange(filterKey, value)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ), [handleFilterChange]);

  // Mobile filter view
  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="search"
              placeholder="Search vehicles..."
              className="pl-10 pr-10"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
            {filters.search && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => handleFilterChange('search', '')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filter Vehicles</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 px-2 text-xs"
                    disabled={activeFilterCount === 0}
                  >
                    <FilterX className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                </div>

                <Separator />

                {renderFilterSelect(
                  "status-filter-mobile",
                  "Status",
                  filters.status,
                  STATUS_OPTIONS,
                  'status'
                )}

                {renderFilterSelect(
                  "make-filter-mobile",
                  "Make",
                  filters.make,
                  MAKE_OPTIONS,
                  'make'
                )}

                {renderFilterSelect(
                  "location-filter-mobile",
                  "Location",
                  filters.location,
                  LOCATION_OPTIONS,
                  'location'
                )}

                {renderFilterSelect(
                  "year-filter-mobile",
                  "Year",
                  filters.year,
                  YEAR_OPTIONS,
                  'year'
                )}

                <div className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => setIsPopoverOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status}
                <button onClick={() => handleFilterChange('status', 'all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.make !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Make: {filters.make}
                <button onClick={() => handleFilterChange('make', 'all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.location !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Location: {filters.location}
                <button onClick={() => handleFilterChange('location', 'all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.year !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Year: {filters.year}
                <button onClick={() => handleFilterChange('year', 'all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop filter view
  return (
    <div className={cn("rounded-lg", className)}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search by VIN, make, or model..."
            className="pl-10 pr-10"
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => handleFilterChange('search', '')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.make}
            onValueChange={(value) => handleFilterChange('make', value)}
          >
            <SelectTrigger id="make-filter">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              {MAKE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.location}
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger id="location-filter">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.year}
            onValueChange={(value) => handleFilterChange('year', value)}
          >
            <SelectTrigger id="year-filter">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs"
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

VehicleFilters.displayName = 'VehicleFilters';

export default VehicleFilters;
