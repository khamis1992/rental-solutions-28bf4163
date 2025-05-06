
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AgreementFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function AgreementFilters({ onFilterChange, currentFilters = {} }: AgreementFiltersProps) {
  const [agreementNumber, setAgreementNumber] = useState(currentFilters?.agreement_number || '');
  const [dateRange, setDateRange] = useState<'rental_period' | 'creation_date'>('rental_period');
  const [startDateFrom, setStartDateFrom] = useState<Date | undefined>(
    currentFilters?.start_date_after ? new Date(currentFilters.start_date_after) : undefined
  );
  const [startDateTo, setStartDateTo] = useState<Date | undefined>(
    currentFilters?.start_date_before ? new Date(currentFilters.start_date_before) : undefined
  );
  const [endDateFrom, setEndDateFrom] = useState<Date | undefined>(
    currentFilters?.end_date_after ? new Date(currentFilters.end_date_after) : undefined
  );
  const [endDateTo, setEndDateTo] = useState<Date | undefined>(
    currentFilters?.end_date_before ? new Date(currentFilters.end_date_before) : undefined
  );
  const [minRent, setMinRent] = useState(currentFilters?.rent_min || '');
  const [maxRent, setMaxRent] = useState(currentFilters?.rent_max || '');
  const [status, setStatus] = useState(currentFilters?.status || 'all');

  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    if (agreementNumber) filters.agreement_number = agreementNumber;
    if (status && status !== 'all') filters.status = status;
    
    // Date filters
    if (startDateFrom) filters.start_date_after = startDateFrom.toISOString();
    if (startDateTo) filters.start_date_before = startDateTo.toISOString();
    if (endDateFrom) filters.end_date_after = endDateFrom.toISOString();
    if (endDateTo) filters.end_date_before = endDateTo.toISOString();
    
    // Rent range
    if (minRent) filters.rent_min = minRent;
    if (maxRent) filters.rent_max = maxRent;
    
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setAgreementNumber('');
    setStartDateFrom(undefined);
    setStartDateTo(undefined);
    setEndDateFrom(undefined);
    setEndDateTo(undefined);
    setMinRent('');
    setMaxRent('');
    setStatus('all');
    
    onFilterChange({
      agreement_number: undefined,
      status: undefined,
      start_date_after: undefined,
      start_date_before: undefined,
      end_date_after: undefined,
      end_date_before: undefined,
      rent_min: undefined,
      rent_max: undefined,
    });
  };

  const handleApplyQuickFilter = (quickFilter: Record<string, any>) => {
    onFilterChange(quickFilter);
  };

  // Generate today and date ranges for quick filters
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Quick Filters */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <Filter className="h-4 w-4 mr-1.5" /> Quick Filters
          </h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-left" 
              onClick={() => handleApplyQuickFilter({ status: 'active' })}
            >
              Active Agreements
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-left" 
              onClick={() => handleApplyQuickFilter({ 
                end_date_after: today.toISOString(),
                end_date_before: next30Days.toISOString()
              })}
            >
              Expiring in 30 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-left"
              onClick={() => handleApplyQuickFilter({ 
                start_date_after: lastMonth.toISOString(),
                start_date_before: today.toISOString()
              })}
            >
              Created in Last Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-left"
              onClick={() => handleApplyQuickFilter({ status: 'pending' })}
            >
              Pending Agreements
            </Button>
          </div>
        </Card>

        {/* Main Filter Form */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreement-number">Agreement Number</Label>
              <Input
                id="agreement-number"
                placeholder="Filter by number"
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date Range Type</Label>
            <RadioGroup
              defaultValue="rental_period"
              value={dateRange}
              onValueChange={(value) => setDateRange(value as 'rental_period' | 'creation_date')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rental_period" id="rental_period" />
                <Label htmlFor="rental_period" className="cursor-pointer">Rental Period</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="creation_date" id="creation_date" />
                <Label htmlFor="creation_date" className="cursor-pointer">Creation Date</Label>
              </div>
            </RadioGroup>
          </div>

          {dateRange === 'rental_period' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date Range</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateFrom ? (
                          format(startDateFrom, "MMM d, yyyy")
                        ) : (
                          "From Date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateFrom}
                        onSelect={setStartDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateTo ? (
                          format(startDateTo, "MMM d, yyyy")
                        ) : (
                          "To Date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateTo}
                        onSelect={setStartDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>End Date Range</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDateFrom ? (
                          format(endDateFrom, "MMM d, yyyy")
                        ) : (
                          "From Date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateFrom}
                        onSelect={setEndDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDateTo ? (
                          format(endDateTo, "MMM d, yyyy")
                        ) : (
                          "To Date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateTo}
                        onSelect={setEndDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Creation Date Range</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateFrom ? (
                        format(startDateFrom, "MMM d, yyyy")
                      ) : (
                        "From Date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateFrom}
                      onSelect={setStartDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateTo ? (
                        format(startDateTo, "MMM d, yyyy")
                      ) : (
                        "To Date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateTo}
                      onSelect={setStartDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-rent">Minimum Rent</Label>
              <Input
                id="min-rent"
                placeholder="Enter minimum"
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-rent">Maximum Rent</Label>
              <Input
                id="max-rent"
                placeholder="Enter maximum"
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
          className="flex items-center"
        >
          <X className="mr-1 h-4 w-4" />
          Reset Filters
        </Button>
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
      </div>
    </div>
  );
}
