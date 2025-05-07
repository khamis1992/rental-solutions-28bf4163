
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
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AgreementFilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function AgreementFilterPanel({ onFilterChange, currentFilters = {} }: AgreementFilterPanelProps) {
  const [agreementNumber, setAgreementNumber] = useState(currentFilters?.agreement_number || '');
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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold mb-2">Common Filters</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onFilterChange({ status: 'active' })}
            >
              Active Agreements
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                const next30Days = new Date();
                next30Days.setDate(next30Days.getDate() + 30);
                onFilterChange({ 
                  end_date_after: new Date().toISOString(),
                  end_date_before: next30Days.toISOString()
                });
              }}
            >
              Expiring in 30 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onFilterChange({ status: 'pending' })}
            >
              Pending Agreements
            </Button>
          </div>
        </div>

        {/* Main Filter Form */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreement-number">Agreement Number</Label>
              <Input
                id="agreement-number"
                placeholder="Filter by number"
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
              >
                <SelectTrigger id="status" className="h-9">
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
            <div className="space-y-2">
              <Label htmlFor="rent-min">Minimum Rent</Label>
              <Input
                id="rent-min"
                placeholder="Min amount"
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-max">Maximum Rent</Label>
              <Input
                id="rent-max"
                placeholder="Max amount"
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date Range</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateFrom ? (
                        format(startDateFrom, "MMM d, yyyy")
                      ) : (
                        "From"
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
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Date To</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateTo ? (
                        format(startDateTo, "MMM d, yyyy")
                      ) : (
                        "To"
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
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetFilters}
              className="h-8"
            >
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleApplyFilters}
              className="h-8"
            >
              <Filter className="mr-1 h-3 w-3" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
