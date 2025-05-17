
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';

interface MaintenanceFiltersProps {
  onFilterChange: (filters: MaintenanceFilterOptions) => void;
  vehicleOptions: Array<{ id: string; label: string }>;
}

export interface MaintenanceFilterOptions {
  searchTerm: string;
  status: string;
  vehicle: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  maintenanceType: string;
}

const MaintenanceFilters = ({ onFilterChange, vehicleOptions }: MaintenanceFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<MaintenanceFilterOptions>({
    searchTerm: '',
    status: '',
    vehicle: '',
    dateFrom: undefined,
    dateTo: undefined,
    maintenanceType: ''
  });

  const handleInputChange = (key: keyof MaintenanceFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      searchTerm: '',
      status: '',
      vehicle: '',
      dateFrom: undefined,
      dateTo: undefined,
      maintenanceType: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_replacement', label: 'Tire Replacement' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'regular_inspection', label: 'Regular Inspection' },
    { value: 'engine_repair', label: 'Engine Repair' }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search maintenance records..."
            value={filters.searchTerm}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={isExpanded ? "bg-muted" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {Object.values(filters).some(Boolean) && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <Card className="p-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Vehicle</label>
              <Select
                value={filters.vehicle}
                onValueChange={(value) => handleInputChange('vehicle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Vehicles</SelectItem>
                  {vehicleOptions.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Maintenance Type</label>
              <Select
                value={filters.maintenanceType}
                onValueChange={(value) => handleInputChange('maintenanceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">From Date</label>
              <DatePicker
                date={filters.dateFrom}
                setDate={(date) => handleInputChange('dateFrom', date)}
                placeholder="From date"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">To Date</label>
              <DatePicker
                date={filters.dateTo}
                setDate={(date) => handleInputChange('dateTo', date)}
                placeholder="To date"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceFilters;
