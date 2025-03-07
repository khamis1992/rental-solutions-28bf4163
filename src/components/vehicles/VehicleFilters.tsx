
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VehicleStatus } from '@/types/vehicle';

export interface VehicleFilterValues {
  status?: VehicleStatus;
  make?: string;
  category?: string;
  location?: string;
  year?: number;
}

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  makes?: string[];
  categories?: string[];
  locations?: string[];
  className?: string;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  onFilterChange,
  makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW'],
  categories = ['economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'truck', 'van'],
  locations = ['Main Office', 'Downtown Branch', 'Airport Location', 'Service Center', 'North Branch', 'City Center'],
  className,
}) => {
  const [filters, setFilters] = useState<VehicleFilterValues>({});
  const [expanded, setExpanded] = useState(false);
  
  const updateFilters = (key: keyof VehicleFilterValues, value: any) => {
    const newFilters = { ...filters };
    
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };
  
  const activeFilterCount = Object.keys(filters).length;
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <CustomButton 
          size="sm" 
          variant="outline"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-primary" variant="default">
              {activeFilterCount}
            </Badge>
          )}
        </CustomButton>
        
        {activeFilterCount > 0 && (
          <CustomButton 
            size="sm" 
            variant="ghost" 
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </CustomButton>
        )}
      </div>
      
      {expanded && (
        <Card className="mb-6 animate-in fade-in-0 zoom-in-95 slide-in-from-top-5 duration-300">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  onValueChange={(value) => updateFilters('status', value || undefined)}
                  value={filters.status || ''}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make-filter">Make</Label>
                <Select 
                  onValueChange={(value) => updateFilters('make', value || undefined)}
                  value={filters.make || ''}
                >
                  <SelectTrigger id="make-filter">
                    <SelectValue placeholder="Any make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any make</SelectItem>
                    {makes.map((make) => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select 
                  onValueChange={(value) => updateFilters('category', value || undefined)}
                  value={filters.category || ''}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location-filter">Location</Label>
                <Select 
                  onValueChange={(value) => updateFilters('location', value || undefined)}
                  value={filters.location || ''}
                >
                  <SelectTrigger id="location-filter">
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year-filter">Year</Label>
                <Input 
                  id="year-filter"
                  type="number" 
                  placeholder="Any year"
                  value={filters.year || ''}
                  onChange={(e) => updateFilters('year', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleFilters;
