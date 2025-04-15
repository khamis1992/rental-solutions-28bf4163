
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PaymentFilters, InstallmentStatus } from '@/types/car-installment';

interface PaymentFiltersBarProps {
  filters: PaymentFilters;
  onFilterChange: (filters: PaymentFilters) => void;
}

export const PaymentFiltersBar: React.FC<PaymentFiltersBarProps> = ({ 
  filters, 
  onFilterChange 
}) => {
  const handleStatusChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      status: value === 'all' ? 'all' : value as InstallmentStatus
    });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFilterChange({ 
      ...filters, 
      [field]: value 
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Select 
        value={filters.status || 'all'} 
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        <div>
          <Input
            type="date"
            placeholder="From"
            value={filters.dateFrom || ''}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-36"
          />
        </div>
        <div>
          <Input
            type="date"
            placeholder="To"
            value={filters.dateTo || ''}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-36"
          />
        </div>
      </div>
    </div>
  );
};
