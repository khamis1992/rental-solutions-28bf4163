
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';

interface AgreementFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function AgreementFilters({ onFilterChange, currentFilters = {} }: AgreementFiltersProps) {
  const [filters, setFilters] = useState({
    status: currentFilters.status || 'all',
    startDateFrom: currentFilters.startDateFrom || '',
    startDateTo: currentFilters.startDateTo || '',
    endDateFrom: currentFilters.endDateFrom || '',
    endDateTo: currentFilters.endDateTo || '',
    minRent: currentFilters.minRent || '',
    maxRent: currentFilters.maxRent || '',
    vehicleId: currentFilters.vehicleId || '',
    customerId: currentFilters.customerId || '',
  });

  useEffect(() => {
    // Update internal state when props change
    setFilters(prev => ({
      ...prev,
      ...currentFilters
    }));
  }, [currentFilters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFilters(prev => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : ''
    }));
  };

  const handleFilterApply = () => {
    // Filter out empty values
    const appliedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== 'all')
    );
    
    onFilterChange(appliedFilters);
  };

  const handleFilterReset = () => {
    setFilters({
      status: 'all',
      startDateFrom: '',
      startDateTo: '',
      endDateFrom: '',
      endDateTo: '',
      minRent: '',
      maxRent: '',
      vehicleId: '',
      customerId: '',
    });
    onFilterChange({ status: 'all' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AgreementStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={AgreementStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={AgreementStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={AgreementStatus.EXPIRED}>Expired</SelectItem>
              <SelectItem value={AgreementStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="space-y-2">
          <Label>Start Date Range</Label>
          <div className="flex space-x-2">
            <DatePicker
              date={filters.startDateFrom ? new Date(filters.startDateFrom) : undefined}
              onDateChange={(date) => handleDateChange('startDateFrom', date)}
              placeholder="From"
            />
            <DatePicker
              date={filters.startDateTo ? new Date(filters.startDateTo) : undefined}
              onDateChange={(date) => handleDateChange('startDateTo', date)}
              placeholder="To"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>End Date Range</Label>
          <div className="flex space-x-2">
            <DatePicker
              date={filters.endDateFrom ? new Date(filters.endDateFrom) : undefined}
              onDateChange={(date) => handleDateChange('endDateFrom', date)}
              placeholder="From"
            />
            <DatePicker
              date={filters.endDateTo ? new Date(filters.endDateTo) : undefined}
              onDateChange={(date) => handleDateChange('endDateTo', date)}
              placeholder="To"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rent Amount Range */}
        <div className="space-y-2">
          <Label>Monthly Rent Range</Label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                name="minRent"
                placeholder="Min"
                value={filters.minRent}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                name="maxRent"
                placeholder="Max"
                value={filters.maxRent}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={handleFilterReset}>Reset</Button>
        <Button onClick={handleFilterApply}>Apply Filters</Button>
      </div>
    </div>
  );
}

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | null) => void;
  placeholder: string;
}

function DatePicker({ date, onDateChange, placeholder }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
