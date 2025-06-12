import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface AgreementFilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void;
  onClose: () => void;
  initialFilters?: Record<string, any>;
}

export function AgreementFilterPanel({
  onFilterChange,
  onClose,
  initialFilters = {},
}: AgreementFilterPanelProps) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);

    // Update active filters
    const existingFilterIndex = activeFilters.findIndex(
      (filter) => filter.id === key
    );

    if (value) {
      const filterLabel = getFilterLabel(key);
      const filterValue = getFilterValue(key, value);

      if (existingFilterIndex >= 0) {
        const updatedFilters = [...activeFilters];
        updatedFilters[existingFilterIndex] = {
          id: key,
          label: filterLabel,
          value: filterValue,
        };
        setActiveFilters(updatedFilters);
      } else {
        setActiveFilters([
          ...activeFilters,
          { id: key, label: filterLabel, value: filterValue },
        ]);
      }
    } else if (existingFilterIndex >= 0) {
      const updatedFilters = [...activeFilters];
      updatedFilters.splice(existingFilterIndex, 1);
      setActiveFilters(updatedFilters);
    }
  };

  const removeFilter = (filterId: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterId];
    setFilters(newFilters);
    onFilterChange(newFilters);

    const updatedFilters = activeFilters.filter(
      (filter) => filter.id !== filterId
    );
    setActiveFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    setActiveFilters([]);
    onFilterChange({});
  };

  const getFilterLabel = (key: string): string => {
    switch (key) {
      case 'status':
        return 'Status';
      case 'customer':
        return 'Customer';
      case 'vehicle':
        return 'Vehicle';
      case 'dateRange':
        return 'Date Range';
      case 'amount':
        return 'Amount';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const getFilterValue = (key: string, value: any): string => {
    switch (key) {
      case 'status':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'dateRange':
        return `${value.start} to ${value.end}`;
      default:
        return String(value);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filter Agreements</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Search */}
          <div>
            <Label htmlFor="customer-filter">Customer</Label>
            <Input
              id="customer-filter"
              placeholder="Search by customer name"
              value={filters.customer || ''}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
            />
          </div>

          {/* Vehicle Search */}
          <div>
            <Label htmlFor="vehicle-filter">Vehicle</Label>
            <Input
              id="vehicle-filter"
              placeholder="Search by vehicle info"
              value={filters.vehicle || ''}
              onChange={(e) => handleFilterChange('vehicle', e.target.value)}
            />
          </div>

          {/* Amount Range */}
          <div>
            <Label htmlFor="amount-filter">Minimum Amount</Label>
            <Input
              id="amount-filter"
              type="number"
              placeholder="Minimum amount"
              value={filters.amount || ''}
              onChange={(e) =>
                handleFilterChange('amount', e.target.value ? Number(e.target.value) : '')
              }
            />
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="pt-4">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filter.label}: {filter.value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
