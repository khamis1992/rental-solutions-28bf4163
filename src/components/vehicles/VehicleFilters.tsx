
import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useVehicles } from '@/hooks/use-vehicles';

export interface VehicleFilterValues {
  status: string;
  make: string;
  location: string;
  year: string;
  category: string;
}

interface VehicleFiltersProps {
  onFilterChange: (filters: VehicleFilterValues) => void;
  initialValues?: VehicleFilterValues;
  className?: string;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({ 
  onFilterChange, 
  initialValues = {
    status: '',
    make: '',
    location: '',
    year: '',
    category: ''
  },
  className 
}) => {
  const [filters, setFilters] = useState<VehicleFilterValues>(initialValues);
  const { useVehicleTypes, useList } = useVehicles();
  
  const { data: vehicleTypes } = useVehicleTypes();
  const { data: vehicles } = useList();
  
  useEffect(() => {
    setFilters(initialValues);
  }, [initialValues]);
  
  const uniqueMakes = Array.from(
    new Set(vehicles?.map(vehicle => vehicle.make) || [])
  ).sort();
  
  const uniqueLocations = Array.from(
    new Set(vehicles?.filter(v => v.location).map(vehicle => vehicle.location) || [])
  ).sort();
  
  const uniqueYears = Array.from(
    new Set(vehicles?.map(vehicle => vehicle.year?.toString()) || [])
  ).sort((a, b) => parseInt(b) - parseInt(a));
  
  const handleFilterChange = (key: keyof VehicleFilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="rented">Rented Out</SelectItem>
          <SelectItem value="maintenance">In Maintenance</SelectItem>
          <SelectItem value="reserved">Reserved</SelectItem>
          <SelectItem value="police_station">At Police Station</SelectItem>
          <SelectItem value="accident">In Accident</SelectItem>
          <SelectItem value="stolen">Reported Stolen</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.make}
        onValueChange={(value) => handleFilterChange('make', value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="All Makes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Makes</SelectItem>
          {uniqueMakes.map(make => (
            <SelectItem key={make} value={make}>{make}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={filters.location}
        onValueChange={(value) => handleFilterChange('location', value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Locations</SelectItem>
          {uniqueLocations.map(location => (
            <SelectItem key={location} value={location}>{location}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={filters.year}
        onValueChange={(value) => handleFilterChange('year', value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="All Years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Years</SelectItem>
          {uniqueYears.map(year => (
            <SelectItem key={year} value={year}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={filters.category}
        onValueChange={(value) => handleFilterChange('category', value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {vehicleTypes?.map(type => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VehicleFilters;
