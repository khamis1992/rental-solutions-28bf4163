
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Search, X, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

interface AgreementFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export const AgreementFilters = ({ onFilterChange, currentFilters = {} }: AgreementFiltersProps) => {
  const [filters, setFilters] = useState({
    status: currentFilters.status || '',
    startDate: currentFilters.startDate || '',
    endDate: currentFilters.endDate || '',
    customerName: currentFilters.customerName || '',
    vehicleLicensePlate: currentFilters.vehicleLicensePlate || '',
    minAmount: currentFilters.minAmount || '',
    maxAmount: currentFilters.maxAmount || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      customerName: '',
      vehicleLicensePlate: '',
      minAmount: '',
      maxAmount: '',
    });
    onFilterChange({});
  };

  const handleApplyFilters = () => {
    // Remove empty filter values
    const appliedFilters = Object.entries(filters)
      .filter(([_, value]) => value !== '')
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    onFilterChange(appliedFilters);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Status</SelectItem>
              <SelectItem value={AgreementStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={AgreementStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={AgreementStatus.CANCELLED}>Cancelled</SelectItem>
              <SelectItem value={AgreementStatus.EXPIRED}>Expired</SelectItem>
              <SelectItem value={AgreementStatus.CLOSED}>Closed</SelectItem>
              <SelectItem value={AgreementStatus.DRAFT}>Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            placeholder="Search by customer name"
            value={filters.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
          />
        </div>

        {/* License Plate Filter */}
        <div className="space-y-2">
          <Label htmlFor="vehicleLicensePlate">License Plate</Label>
          <Input
            id="vehicleLicensePlate"
            placeholder="Search by license plate"
            value={filters.vehicleLicensePlate}
            onChange={(e) => handleInputChange('vehicleLicensePlate', e.target.value)}
          />
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>Start Date After</Label>
          <DatePicker
            value={filters.startDate ? new Date(filters.startDate) : undefined}
            onChange={(date) => 
              handleInputChange('startDate', date ? date.toISOString() : '')
            }
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>End Date Before</Label>
          <DatePicker
            value={filters.endDate ? new Date(filters.endDate) : undefined}
            onChange={(date) => 
              handleInputChange('endDate', date ? date.toISOString() : '')
            }
          />
        </div>

        {/* Min Amount Filter */}
        <div className="space-y-2">
          <Label htmlFor="minAmount">Min Amount</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="Min rental amount"
            value={filters.minAmount}
            onChange={(e) => handleInputChange('minAmount', e.target.value)}
          />
        </div>

        {/* Max Amount Filter */}
        <div className="space-y-2">
          <Label htmlFor="maxAmount">Max Amount</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder="Max rental amount"
            value={filters.maxAmount}
            onChange={(e) => handleInputChange('maxAmount', e.target.value)}
          />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleClearFilters}
          className="flex items-center"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
        <Button 
          onClick={handleApplyFilters}
          className="flex items-center"
        >
          <Search className="h-4 w-4 mr-1" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
