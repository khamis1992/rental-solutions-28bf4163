
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleStatus } from '@/types/vehicle';

// Define the filter values interface
export interface VehicleFilterValues {
  status: string;
  location: string;
  year: string;
  category: string;
  search?: string;
}

// Props interface
interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  initialValues?: VehicleFilterValues;
  className?: string;
}
const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  onFilterChange,
  initialValues = {
    status: 'all',
    location: 'all',
    year: 'all',
    category: 'all',
    search: ''
  },
  className
}) => {
  // State for filters
  const [filters, setFilters] = useState<VehicleFilterValues>(initialValues);

  // Apply filters when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handle input changes
  const handleFilterChange = (key: keyof VehicleFilterValues, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search input change with a small delay
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update the filters with the search value
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };
  return <div className={cn("grid gap-4 p-4 border rounded-lg bg-card", className)}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search field */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input type="search" placeholder="Search by VIN..." className="pl-10" value={filters.search || ''} onChange={handleSearchChange} />
        </div>
        
        {/* Status filter */}
        <div>
          <Label htmlFor="status-filter" className="mb-1 block">Status</Label>
          <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="police_station">Police Station</SelectItem>
              <SelectItem value="accident">Accident</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Location filter */}
        <div>
          <Label htmlFor="location-filter" className="mb-1 block">Location</Label>
          <Select value={filters.location} onValueChange={value => handleFilterChange('location', value)}>
            <SelectTrigger id="location-filter">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Main Garage">Main Garage</SelectItem>
              <SelectItem value="Downtown">Downtown</SelectItem>
              <SelectItem value="Airport">Airport</SelectItem>
              <SelectItem value="North Branch">North Branch</SelectItem>
              <SelectItem value="South Branch">South Branch</SelectItem>
              <SelectItem value="East Branch">East Branch</SelectItem>
              <SelectItem value="West Branch">West Branch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Year filter */}
        <div>
          <Label htmlFor="year-filter" className="mb-1 block">Year</Label>
          <Select value={filters.year} onValueChange={value => handleFilterChange('year', value)}>
            <SelectTrigger id="year-filter">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
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
    </div>;
};
export default VehicleFilters;
