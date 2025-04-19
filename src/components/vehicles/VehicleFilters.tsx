
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { vehicleStatusOptions, vehicleMakeOptions, vehicleTypeOptions } from './vehicleFilterOptions';

export interface VehicleFilterValues {
  status: string;
  make: string;
  location: string;
  year: string;
  category: string;
  searchTerm?: string;
}

interface VehicleFiltersProps {
  onFilterChange: (newFilters: VehicleFilterValues) => void;
  className?: string;
}

export const VehicleFilters: React.FC<VehicleFiltersProps> = ({ 
  onFilterChange, 
  className = "" 
}) => {
  const [filters, setFilters] = React.useState<VehicleFilterValues>({
    status: 'all',
    make: 'all',
    location: '',
    year: '',
    category: 'all'
  });

  const handleFilterChange = (key: keyof VehicleFilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      status: 'all',
      make: 'all',
      location: '',
      year: '',
      category: 'all',
      searchTerm: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Status filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Vehicle Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {vehicleStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Make filter */}
        <div className="space-y-2">
          <Label htmlFor="make-filter">Make</Label>
          <Select 
            value={filters.make} 
            onValueChange={(value) => handleFilterChange('make', value)}
          >
            <SelectTrigger id="make-filter">
              <SelectValue placeholder="Make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {vehicleMakeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type/Category filter */}
        <div className="space-y-2">
          <Label htmlFor="category-filter">Vehicle Type</Label>
          <Select 
            value={filters.category} 
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {vehicleTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year filter */}
        <div className="space-y-2">
          <Label htmlFor="year-filter">Year</Label>
          <Input
            id="year-filter"
            placeholder="e.g., 2023"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
          />
        </div>

        {/* Location filter */}
        <div className="space-y-2">
          <Label htmlFor="location-filter">Location</Label>
          <Input
            id="location-filter"
            placeholder="e.g., Doha"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search vehicles..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="max-w-xs"
          />
          <Button size="sm" className="gap-1">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleFilters;
