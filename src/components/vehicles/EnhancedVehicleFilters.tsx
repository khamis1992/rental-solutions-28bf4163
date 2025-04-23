
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter, Search, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';

interface EnhancedVehicleFiltersProps {
  initialValues: VehicleFilterValues;
  onFilterChange: (filters: VehicleFilterValues) => void;
  onSaveView?: () => void;
  makes?: string[];
  locations?: string[];
  years?: string[];
  categories?: Array<{ id: string; name: string }>;
}

const EnhancedVehicleFilters: React.FC<EnhancedVehicleFiltersProps> = ({
  initialValues,
  onFilterChange,
  onSaveView,
  makes = [],
  locations = [],
  years = [],
  categories = []
}) => {
  const [filters, setFilters] = useState<VehicleFilterValues>(initialValues);
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Update active filters display
  useEffect(() => {
    const active: string[] = [];
    if (filters.status && filters.status !== 'all') {
      active.push(`Status: ${filters.status}`);
    }
    if (filters.make && filters.make !== 'all') {
      active.push(`Make: ${filters.make}`);
    }
    if (filters.location && filters.location !== 'all') {
      active.push(`Location: ${filters.location}`);
    }
    if (filters.year && filters.year !== 'all') {
      active.push(`Year: ${filters.year}`);
    }
    if (filters.category && filters.category !== 'all') {
      const categoryName = categories.find(c => c.id === filters.category)?.name || filters.category;
      active.push(`Type: ${categoryName}`);
    }
    if (filters.search) {
      active.push(`Search: ${filters.search}`);
    }
    setActiveFilters(active);
  }, [filters, categories]);

  const handleChange = (field: string, value: string) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClearFilter = (filter: string) => {
    const field = filter.split(':')[0].trim().toLowerCase();
    const updatedFilters = { ...filters };
    
    switch (field) {
      case 'status':
        updatedFilters.status = 'all';
        break;
      case 'make':
        updatedFilters.make = 'all';
        break;
      case 'location':
        updatedFilters.location = 'all';
        break;
      case 'year':
        updatedFilters.year = 'all';
        break;
      case 'type':
        updatedFilters.category = 'all';
        break;
      case 'search':
        updatedFilters.search = '';
        break;
    }
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClearAll = () => {
    const resetFilters = {
      status: 'all',
      make: 'all',
      location: 'all',
      year: 'all',
      category: 'all',
      search: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="whitespace-nowrap"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {expanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </Button>
          
          {onSaveView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveView}
              className="whitespace-nowrap"
            >
              <Save className="mr-2 h-4 w-4" />
              Save View
            </Button>
          )}
        </div>
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleClearFilter(filter)}
              />
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      )}
      
      {expanded && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Make</label>
                <Select 
                  value={filters.make} 
                  onValueChange={(value) => handleChange('make', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {makes.map((make) => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => handleChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Year</label>
                <Select 
                  value={filters.year} 
                  onValueChange={(value) => handleChange('year', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Vehicle Type</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVehicleFilters;
