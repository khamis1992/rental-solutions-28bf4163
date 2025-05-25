import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Calendar } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"

interface FilterState {
  status: string;
  dateRange: string;
  searchTerm: string;
}

export function CustomerListFilter() {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    dateRange: '',
    searchTerm: ''
  });

  return (
    <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input 
          type="search" 
          id="search" 
          placeholder="Search customers..." 
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
        />
      </div>
      
      <div>
        <Label>Date Range</Label>
        <DateRangePicker />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Input 
          type="text" 
          id="status" 
          placeholder="Filter by status..." 
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        />
      </div>
    </div>
  );
}
