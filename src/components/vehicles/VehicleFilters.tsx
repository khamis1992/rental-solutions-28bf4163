
import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VehicleFilterParams, VehicleStatus, VehicleType } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';

export interface VehicleFilterValues {
  status?: VehicleStatus;
  make?: string;
  category?: string;
  location?: string;
  year?: number | null;
  [key: string]: string | number | null | undefined; // Add index signature to allow dynamic property assignment
}

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  makes?: string[];
  locations?: string[];
  className?: string;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  onFilterChange,
  makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW'],
  locations = ['Main Office', 'Downtown Branch', 'Airport Location', 'Service Center', 'North Branch', 'City Center'],
  className,
}) => {
  const [filters, setFilters] = useState<VehicleFilterValues>({});
  const [expanded, setExpanded] = useState(false);
  const { useVehicleTypes } = useVehicles();
  const { data: vehicleTypes, isLoading: isLoadingTypes } = useVehicleTypes();
  
  const { useList } = useVehicles();
  const { data: vehicles } = useList();
  
  const [uniqueMakes, setUniqueMakes] = useState<string[]>(makes);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>(locations);
  
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const extractedMakes = Array.from(
        new Set(vehicles.map(v => v.make).filter(Boolean))
      );
      if (extractedMakes.length > 0) {
        setUniqueMakes(extractedMakes);
      }
      
      const extractedLocations = Array.from(
        new Set(vehicles.map(v => v.location).filter(Boolean))
      );
      if (extractedLocations.length > 0) {
        setUniqueLocations(extractedLocations);
      }
    }
  }, [vehicles]);
  
  const updateFilters = (key: keyof VehicleFilterValues, value: string | number | undefined | null) => {
    const newFilters = { ...filters };
    
    if (value !== undefined && value !== null && value !== '') {
      // With the index signature added above, this assignment is now type-safe
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
                    {uniqueMakes.map((make) => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type-filter">Vehicle Type</Label>
                <Select 
                  onValueChange={(value) => updateFilters('category', value || undefined)}
                  value={filters.category || ''}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    {vehicleTypes && vehicleTypes.map((type: VehicleType) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
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
                    {uniqueLocations.map((location) => (
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
