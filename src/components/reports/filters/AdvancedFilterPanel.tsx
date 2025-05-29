
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X, CalendarIcon, Check, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export type FilterOption = {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
  displayValue?: string;
};

export type FilterGroup = {
  id: string;
  name: string;
  options: {
    id: string;
    label: string;
    value: string;
  }[];
  type: 'select' | 'date' | 'dateRange' | 'number' | 'text';
};

interface AdvancedFilterPanelProps {
  filterGroups: FilterGroup[];
  appliedFilters: FilterOption[];
  onApplyFilter: (filter: FilterOption) => void;
  onRemoveFilter: (filter: FilterOption) => void;
  onClearFilters: () => void;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filterGroups,
  appliedFilters,
  onApplyFilter,
  onRemoveFilter,
  onClearFilters
}) => {
  const [selectedGroup, setSelectedGroup] = useState<FilterGroup | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOption['operator']>('equals');
  const [filterValue, setFilterValue] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleGroupSelect = (group: FilterGroup) => {
    setSelectedGroup(group);
    setFilterValue(null);
    
    switch (group.type) {
      case 'date':
        setSelectedOperator('equals');
        break;
      case 'dateRange':
        setSelectedOperator('between');
        break;
      case 'number':
        setSelectedOperator('equals');
        break;
      case 'text':
        setSelectedOperator('contains');
        break;
      case 'select':
        setSelectedOperator('in');
        break;
      default:
        setSelectedOperator('equals');
    }
  };

  const handleApplyFilter = () => {
    if (!selectedGroup || filterValue === null) return;
    
    let displayValue = filterValue;
    
    if (selectedGroup.type === 'select') {
      const option = selectedGroup.options.find(opt => opt.value === filterValue);
      displayValue = option?.label || filterValue;
    } else if (selectedGroup.type === 'date') {
      displayValue = format(new Date(filterValue), 'PP');
    } else if (selectedGroup.type === 'dateRange' && dateRange?.from && dateRange?.to) {
      displayValue = `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
      onApplyFilter({
        field: selectedGroup.id,
        operator: selectedOperator,
        value: dateRange,
        displayValue
      });
      return;
    }
    
    onApplyFilter({
      field: selectedGroup.id,
      operator: selectedOperator,
      value: filterValue,
      displayValue: String(displayValue)
    });
  };

  const renderFilterInput = () => {
    if (!selectedGroup) return null;

    switch (selectedGroup.type) {
      case 'select':
        return (
          <div className="space-y-2">
            {selectedGroup.options.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={option.id} 
                  checked={filterValue === option.value}
                  onCheckedChange={() => setFilterValue(option.value)}
                />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-2">
            <div className="grid gap-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={filterValue ? new Date(filterValue) : undefined}
                onSelect={(date) => setFilterValue(date)}
                className="rounded-md border"
              />
            </div>
          </div>
        );
      case 'dateRange':
        return (
          <div className="space-y-2">
            <div className="grid gap-2">
              <Label>Select Date Range</Label>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                className="rounded-md border"
              />
            </div>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <div className="grid gap-2">
              <Label>Value</Label>
              <div className="flex space-x-2">
                <select 
                  className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value as FilterOption['operator'])}
                >
                  <option value="equals">Equals</option>
                  <option value="greaterThan">Greater than</option>
                  <option value="lessThan">Less than</option>
                </select>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                  value={filterValue || ''}
                  onChange={(e) => setFilterValue(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2">
            <div className="grid gap-2">
              <Label>Text Search</Label>
              <div className="flex space-x-2">
                <select 
                  className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value as FilterOption['operator'])}
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                </select>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                  value={filterValue || ''}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        {appliedFilters.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Add Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <div className="grid grid-cols-2">
              <div className="border-r p-2 max-h-[300px] overflow-y-auto">
                {filterGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant={selectedGroup?.id === group.id ? "default" : "ghost"}
                    size="sm"
                    className="justify-start w-full"
                    onClick={() => handleGroupSelect(group)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
              
              <div className="p-3 max-h-[300px] overflow-y-auto">
                {selectedGroup ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">{selectedGroup.name}</h4>
                    <Separator />
                    {renderFilterInput()}
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={handleApplyFilter}
                      disabled={filterValue === null && !(selectedGroup.type === 'dateRange' && dateRange?.from && dateRange?.to)}
                    >
                      Apply Filter
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Select a filter type
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {appliedFilters.map((filter, index) => (
          <Badge key={index} variant="outline" className="gap-1 h-8 px-2">
            <span>{filterGroups.find(g => g.id === filter.field)?.name}: {filter.displayValue}</span>
            <button
              onClick={() => onRemoveFilter(filter)}
              className="ml-1 rounded-full w-4 h-4 inline-flex items-center justify-center bg-muted hover:bg-muted-foreground hover:text-background"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
